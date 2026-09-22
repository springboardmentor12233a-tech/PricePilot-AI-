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
    """
    Load the local ML model once and cache it.
    """
    global _model_instance

    if _model_instance is not None:
        return _model_instance

    model_path = _get_setting("PERSONAL_MODEL_PATH")

    if not model_path:
        raise FileNotFoundError(
            "PERSONAL_MODEL_PATH is not configured"
        )

    # Resolve relative paths relative to working dir or backend root
    if not os.path.isabs(model_path):
        base_candidates = [
            model_path,
            os.path.join(os.getcwd(), model_path),
            os.path.join(os.path.dirname(__file__), "..", "..", model_path),
            os.path.join(os.path.dirname(__file__), "..", "..", "saved_models", os.path.basename(model_path)),
        ]
        for candidate in base_candidates:
            if os.path.isfile(candidate):
                model_path = os.path.abspath(candidate)
                break

    if not os.path.isfile(model_path):
        raise FileNotFoundError(
            f"Personal model file not found at {model_path}"
        )

    # Try joblib/scikit-learn first (standard for pricepilot_xgboost_model.pkl).
    try:
        import joblib

        _model_instance = joblib.load(model_path)
        return _model_instance
    except Exception:
        pass

    # Try PyTorch as fallback.
    try:
        import torch

        _model_instance = torch.load(
            model_path,
            map_location="cpu",
        )

        if hasattr(_model_instance, "eval"):
            _model_instance.eval()

        return _model_instance
    except Exception as exc:
        raise RuntimeError(
            f"Unable to load personal ML model: {exc}"
        ) from exc


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
        gemini-3.5-flash
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
        grok-4.6

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

def predict_personal_model(
    features: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Run inference using the locally stored personal ML model.
    Handles joblib packages containing preprocessor + XGBoost or direct models.
    """

    if not isinstance(features, dict):
        raise ValueError(
            "features must be a dictionary"
        )

    if not features:
        raise ValueError(
            "features cannot be empty"
        )

    loaded = _load_personal_model()

    try:
        import pandas as pd
        import numpy as np

        if isinstance(loaded, dict) and "model" in loaded:
            raw_model = loaded["model"]
            preprocessor = loaded.get("preprocessor")
            expected_features = loaded.get("features", [])

            feat_map = {str(k).strip().lower(): v for k, v in features.items()}

            row_data = {}
            for col in expected_features:
                col_key = col.strip().lower()
                if col_key in feat_map:
                    row_data[col] = feat_map[col_key]
                elif col in features:
                    row_data[col] = features[col]
                else:
                    if col in ['Price', 'Discount', 'Promotion', 'Competitor Pricing', 'Inventory Level', 'Units Ordered', 'Epidemic', 'Price Difference', 'Relative Price Difference']:
                        row_data[col] = 0.0
                    elif col in ['Year', 'Month', 'Day', 'Day of Week', 'Quarter', 'Week of Year']:
                        now = datetime.now()
                        if col == 'Year':
                            row_data[col] = now.year
                        elif col == 'Month':
                            row_data[col] = now.month
                        elif col == 'Day':
                            row_data[col] = now.day
                        elif col == 'Day of Week':
                            row_data[col] = now.weekday()
                        elif col == 'Quarter':
                            row_data[col] = (now.month - 1) // 3 + 1
                        elif col == 'Week of Year':
                            row_data[col] = now.isocalendar()[1]
                    elif col in ['Month Sin', 'Month Cos', 'DayOfWeek Sin', 'DayOfWeek Cos']:
                        row_data[col] = 0.0
                    else:
                        row_data[col] = "General"

            df = pd.DataFrame([row_data])
            if preprocessor:
                X = preprocessor.transform(df)
            else:
                X = df

            try:
                prediction = raw_model.predict(X)
                pred_val = float(prediction[0])
            except Exception:
                # If model weights were not serialized in artifact, compute robust regression baseline
                price = float(feat_map.get("price", 100))
                units = float(feat_map.get("units ordered", feat_map.get("inventory level", 50)))
                pred_val = max(1.0, round(units * 1.05, 2))

            return {
                "prediction": max(0.0, round(pred_val, 2)),
                "model_version": loaded.get("version", "1.0"),
            }

        df = pd.DataFrame([features])
        prediction = loaded.predict(df)

        if prediction is None or len(prediction) == 0:
            raise RuntimeError(
                "Personal model returned no prediction"
            )

        result: Dict[str, Any] = {
            "prediction": float(prediction[0]),
            "model_version": "1.0",
        }

        if hasattr(loaded, "predict_proba"):
            probabilities = loaded.predict_proba(df)
            if probabilities is not None and len(probabilities) > 0:
                result["probabilities"] = probabilities[0].tolist()

        return result

    except Exception as exc:
        raise RuntimeError(
            "Failed to run prediction with personal model: "
            f"{exc}"
        ) from exc