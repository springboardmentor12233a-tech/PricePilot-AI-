import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { api } from "../lib/api";

/**
 * Reusable "Download Report" button.
 *
 * Fixed bugs:
 *  1. Was reading localStorage key "token" / "access_token" — the app uses "pricepilot_token".
 *  2. Was using NEXT_PUBLIC_API_URL env var — the app uses NEXT_PUBLIC_API_BASE_URL (see lib/api.js).
 *  3. Was implementing its own fetch logic duplicating lib/api.js; now delegates to api.downloadReport()
 *     which already handles auth, error redirects, and blob download correctly.
 *  4. Was using bg-indigo-600 which is outside the design system; replaced with bg-primary.
 */
export default function DownloadReportButton({ type = "full", format = "csv", label }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setBusy(true);
    setError("");
    try {
      await api.downloadReport(type, format);
    } catch (e) {
      setError(e.message || "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={download}
        disabled={busy}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {busy ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        {busy ? "Generating…" : label || `Download ${format.toUpperCase()} Report`}
      </button>
      {error && (
        <p className="mt-2 text-xs text-danger">{error}</p>
      )}
    </div>
  );
}