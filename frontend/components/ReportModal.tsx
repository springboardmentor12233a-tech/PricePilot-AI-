"use client";

import React, { useState } from "react";
import { FileText, Table, Download, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "excel">("pdf");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    setErrorMessage(null);
    setDownloadSuccess(false);

    try {
      const blob = await api.reports.downloadSummary(selectedFormat);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      const extension = selectedFormat === "pdf" ? "pdf" : "xlsx";
      link.setAttribute("download", `PricePilot_Executive_Report_${Date.now()}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Report download error:", err);
      setErrorMessage(err.response?.data?.detail || "Failed to generate report. Please check permissions or server status.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-white">Export Intelligence Report</h3>
            <p className="text-xs text-slate-400">Executive portfolio synthesis & econometric models</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Select export format. Reports include executive KPI metrics, 8-SKU price elasticity recommendations, and historical optimization trajectory.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedFormat("pdf")}
            className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
              selectedFormat === "pdf"
                ? "border-teal-500 bg-teal-500/10 text-white shadow-lg shadow-teal-500/10"
                : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700"
            }`}
          >
            <FileText className={`w-8 h-8 mb-2 ${selectedFormat === "pdf" ? "text-teal-400" : "text-slate-500"}`} />
            <span className="text-sm font-semibold">Executive PDF</span>
            <span className="text-[10px] text-slate-400 mt-1">With Matplotlib Revenue Chart</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFormat("excel")}
            className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
              selectedFormat === "excel"
                ? "border-teal-500 bg-teal-500/10 text-white shadow-lg shadow-teal-500/10"
                : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700"
            }`}
          >
            <Table className={`w-8 h-8 mb-2 ${selectedFormat === "excel" ? "text-teal-400" : "text-slate-500"}`} />
            <span className="text-sm font-semibold">Excel Workbook</span>
            <span className="text-[10px] text-slate-400 mt-1">Multi-sheet raw data (.xlsx)</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {downloadSuccess && (
          <div className="p-3 mb-4 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center gap-2 text-xs text-teal-300">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>Report generated and downloaded successfully!</span>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-navy-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 transition-all shadow-md shadow-teal-500/20"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Generate & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
