import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings


# ============================================================
# Constants
# ============================================================

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
XAI_BASE_URL = "https://api.x.ai/v1"

DEFAULT_HTTP_TIMEOUT = 90.0
DEFAULT_GROK_TIMEOUT = 180.0

_model_instance: Any = None


# ============================================================
# Helper functions
# ============================================================

def _get_setting(name: str, default: Any = None) -> Any:
    """
    Safely retrieve a setting from the application configuration.
    """
    return getattr(settings, name, default)


def _safe_error_body(response: httpx.Response) -> str:
    """
    Return a provider error body without exposing API keys.
    """
    try:
        data = response.json()

        if isinstance(data, dict):
            # Remove potentially sensitive fields.
            sanitized = dict(data)

            for key in (
                "api_key",
                "key",
                "authorization",
                "access_token",
                "token",
            ):
                sanitized.pop(key, None)

            error = sanitized.get("error")

            if isinstance(error, dict):
                sanitized["error"] = {
                    k: v
                    for k, v in error.items()
                    if k not in {
                        "api_key",
                        "key",
                        "authorization",
                        "access_token",
                        "token",
                    }
                }

            return str(sanitized)

        return str(data)

    except Exception:
        return response.text[:1000]


# ============================================================
# Personal ML model
# ============================================================

def _load_personal_model():
    """Load and validate the configured joblib artifact once."""
    global _model_instance

    if _model_instance is not None:
        return _model_instance

    model_path = _get_setting("PERSONAL_MODEL_PATH")
    if not model_path:
        raise FileNotFoundError("PERSONAL_MODEL_PATH is not configured")

    if not os.path.isabs(model_path):
        candidates = [
            model_path,
            os.path.join(os.getcwd(), model_path),
            os.path.join(os.path.dirname(__file__), "..", "..", model_path),
            os.path.join(
                os.path.dirname(__file__), "..", "..", "saved_models",
                os.path.basename(model_path),
            ),
        ]
        for candidate in candidates:
            if os.path.isfile(candidate):
                model_path = os.path.abspath(candidate)
                break

    if not os.path.isfile(model_path):
        raise FileNotFoundError("Configured personal model artifact was not found")

    try:
        import joblib
        from sklearn.utils.validation import check_is_fitted

        loaded = joblib.load(model_path)
        if isinstance(loaded, dict) and "model" in loaded:
            model = loaded["model"]
            preprocessor = loaded.get("preprocessor")
            features = loaded.get("features")
            if not hasattr(model, "predict") or not isinstance(features, (list, tuple)) or not features:
                raise ValueError("Invalid model artifact schema")
            check_is_fitted(model)
            if preprocessor is not None:
                check_is_fitted(preprocessor)
        else:
            if not hasattr(loaded, "predict"):
                raise ValueError("Artifact has no predictor")
            check_is_fitted(loaded)

        _model_instance = loaded
        return loaded
    except Exception as exc:
        raise RuntimeError("Configured personal model artifact is invalid") from exc


# ============================================================
# Gemini
# ============================================================

async def call_gemini(
    model: str,
    prompt: str,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    stop_sequences: Optional[list[str]] = None,
) -> str:
    """
    Call Google Gemini using the REST GenerateContent API.

    Current endpoint:
        https://generativelanguage.googleapis.com/v1beta

    Example model:
        gemini-3.8-flash
    """

    api_key = _get_setting("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not set in configuration"
        )

    if not model or not isinstance(model, str):
        raise ValueError(
            "Invalid Gemini model identifier"
        )

    if not prompt or not prompt.strip():
        raise ValueError(
            "Gemini prompt cannot be empty"
        )

    url = (
        f"{GEMINI_BASE_URL}/models/"
        f"{model}:generateContent"
    )

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }

    generation_config: Dict[str, Any] = {}

    if temperature is not None:
        generation_config["temperature"] = temperature

    if max_tokens is not None:
        generation_config["maxOutputTokens"] = max_tokens

    if stop_sequences:
        generation_config["stopSequences"] = stop_sequences

    payload: Dict[str, Any] = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": prompt,
                    }
                ],
            }
        ]
    }

    if generation_config:
        payload["generationConfig"] = generation_config

    try:
        async with httpx.AsyncClient(
            timeout=DEFAULT_HTTP_TIMEOUT
        ) as client:

            response = await client.post(
                url,
                headers=headers,
                json=payload,
            )

        response.raise_for_status()

        data = response.json()

    except httpx.TimeoutException as exc:
        raise RuntimeError(
            "Gemini provider request timed out after "
            f"{DEFAULT_HTTP_TIMEOUT:.0f} seconds"
        ) from exc

    except httpx.HTTPStatusError as exc:
        detail = _safe_error_body(exc.response)

        raise RuntimeError(
            "Gemini provider returned HTTP "
            f"{exc.response.status_code}: {detail}"
        ) from exc

    except httpx.HTTPError as exc:
        raise RuntimeError(
            f"Gemini provider request failed: {exc}"
        ) from exc

    # --------------------------------------------------------
    # Parse Gemini response
    # --------------------------------------------------------

    try:
        candidates = data.get("candidates", [])

        if not candidates:
            raise RuntimeError(
                "Gemini returned no candidates"
            )

        content = candidates[0].get("content", {})

        parts = content.get("parts", [])

        text_parts = []

        for part in parts:
            text = part.get("text")

            if text:
                text_parts.append(text)

        if text_parts:
            return "\n".join(text_parts)

        # Helpful error when Gemini returns an empty result.
        finish_reason = candidates[0].get(
            "finishReason"
        )

        raise RuntimeError(
            "Gemini returned no text"
            + (
                f" (finishReason={finish_reason})"
                if finish_reason
                else ""
            )
        )

    except RuntimeError:
        raise

    except (AttributeError, TypeError, KeyError) as exc:
        raise RuntimeError(
            "Unexpected response format from Gemini API"
        ) from exc


# ============================================================
# xAI Grok
# ============================================================

async def call_grok(
    model: str,
    prompt: str,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    top_p: Optional[float] = None,
) -> str:
    """
    Call xAI Grok using the xAI Responses API.

    Current endpoint:
        https://api.x.ai/v1/responses

    Current model:
        grok-4.7

    IMPORTANT:
        This is xAI Grok, not Groq.
    """

    api_key = _get_setting("XAI_API_KEY")

    if not api_key:
        raise ValueError(
            "XAI_API_KEY is not set in configuration"
        )

    if not model or not isinstance(model, str):
        raise ValueError(
            "Invalid xAI Grok model identifier"
        )

    if not prompt or not prompt.strip():
        raise ValueError(
            "Grok prompt cannot be empty"
        )

    url = (
        f"{XAI_BASE_URL}/responses"
    )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload: Dict[str, Any] = {
        "model": model,
        "input": prompt,
    }

    if temperature is not None:
        payload["temperature"] = temperature

    if top_p is not None:
        payload["top_p"] = top_p

    if max_tokens is not None:
        payload["max_output_tokens"] = max_tokens

    try:
        async with httpx.AsyncClient(
            timeout=DEFAULT_GROK_TIMEOUT
        ) as client:

            response = await client.post(
                url,
                headers=headers,
                json=payload,
            )

        response.raise_for_status()

        data = response.json()

    except httpx.TimeoutException as exc:
        raise RuntimeError(
            "xAI Grok provider request timed out after "
            f"{DEFAULT_GROK_TIMEOUT:.0f} seconds"
        ) from exc

    except httpx.HTTPStatusError as exc:
        detail = _safe_error_body(exc.response)

        raise RuntimeError(
            "xAI Grok provider returned HTTP "
            f"{exc.response.status_code}: {detail}"
        ) from exc

    except httpx.HTTPError as exc:
        raise RuntimeError(
            f"xAI Grok provider request failed: {exc}"
        ) from exc

    # --------------------------------------------------------
    # Parse xAI Responses API response
    # --------------------------------------------------------

    try:
        output_text = data.get("output_text")

        if output_text:
            return output_text

        output = data.get("output", [])

        text_parts = []

        for item in output:
            if not isinstance(item, dict):
                continue

            content = item.get("content", [])

            if not isinstance(content, list):
                continue

            for part in content:
                if not isinstance(part, dict):
                    continue

                text = part.get("text")

                if text:
                    text_parts.append(text)

        if text_parts:
            return "\n".join(text_parts)

        raise RuntimeError(
            "xAI Grok returned an empty response"
        )

    except RuntimeError:
        raise

    except (AttributeError, TypeError, KeyError) as exc:
        raise RuntimeError(
            "Unexpected response format from xAI Grok API"
        ) from exc


# ============================================================
# Personal ML prediction
# ============================================================

def predict_personal_model(features: Dict[str, Any]) -> Dict[str, Any]:
    """Run inference with the validated, fitted local model artifact."""
    if not isinstance(features, dict) or not features:
        raise ValueError("features must be a non-empty dictionary")

    loaded = _load_personal_model()
    try:
        import numpy as np
        import pandas as pd

        if isinstance(loaded, dict):
            model = loaded["model"]
            preprocessor = loaded.get("preprocessor")
            expected_features = list(loaded["features"])
            feature_values = {
                str(key).strip().lower(): value for key, value in features.items()
            }
            now = datetime.now()
            numeric_defaults = {
                "price", "discount", "promotion", "competitor pricing",
                "inventory level", "units ordered", "epidemic",
                "price difference", "relative price difference", "month sin",
                "month cos", "dayofweek sin", "dayofweek cos",
            }
            calendar_defaults = {
                "year": now.year,
                "month": now.month,
                "day": now.day,
                "day of week": now.weekday(),
                "quarter": (now.month - 1) // 3 + 1,
                "week of year": now.isocalendar()[1],
            }
            row = {}
            for column in expected_features:
                key = column.strip().lower()
                if key in feature_values:
                    row[column] = feature_values[key]
                elif key in calendar_defaults:
                    row[column] = calendar_defaults[key]
                elif key in numeric_defaults:
                    row[column] = 0.0
                else:
                    row[column] = "General"

            frame = pd.DataFrame([row], columns=expected_features)
            model_input = (
                preprocessor.transform(frame) if preprocessor is not None else frame
            )
            version = str(loaded.get("version", "unknown"))
        else:
            model = loaded
            model_input = pd.DataFrame([features])
            version = "unknown"

        prediction = np.asarray(model.predict(model_input), dtype=float).reshape(-1)
        if prediction.size != 1 or not np.isfinite(prediction[0]):
            raise ValueError("Model returned no finite scalar prediction")

        return {"prediction": float(prediction[0]), "model_version": version}
    except Exception as exc:
        raise RuntimeError("Personal model inference failed") from exc
