"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import { api } from "@/lib/api";
import {
  Shield,
  Clock,
  User as UserIcon,
  RefreshCw,
  FileText,
  Lock,
  Download,
  Cpu,
  Globe,
} from "lucide-react";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.audit.list(50);
      setLogs(data);
    } catch (e) {
      console.error("Failed to load audit logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    if (action.includes("LOGIN")) return "bg-teal-500/20 text-teal-300 border-teal-500/40";
    if (action.includes("REPORT")) return "bg-sky-500/20 text-sky-300 border-sky-500/40";
    if (action.includes("MODEL")) return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    if (action.includes("ROLE") || action.includes("USER")) return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    return "bg-slate-700/30 text-slate-300 border-slate-600/40";
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-navy-950 flex flex-col">
        <Navbar />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    Admin Governance Only
                  </span>
                </div>
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight">
                  Enterprise Audit Trail
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Chronological record of user authentication, report exports, model recalibrations, and role adjustments
                </p>
              </div>

              <button
                type="button"
                onClick={fetchLogs}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-400" : ""}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            {/* Audit Logs Table */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Timestamp (UTC)</th>
                      <th className="py-3 px-3">User & Role</th>
                      <th className="py-3 px-3">Action Event</th>
                      <th className="py-3 px-3">Event Details</th>
                      <th className="py-3 px-3 text-right">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Loading audit records from SQLite governance store...
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No audit events recorded yet.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString("en-US", {
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-white font-medium">{log.user_email}</span>
                            <span className="ml-2 text-[10px] uppercase text-teal-400">({log.role})</span>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getActionBadge(log.action)}`}>
                              {log.action}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-slate-300 max-w-md font-sans">
                            {log.details}
                          </td>

                          <td className="py-3 px-3 text-right text-slate-500 whitespace-nowrap">
                            {log.ip_address}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        <ChatWidget />
      </div>
    </AuthGuard>
  );
}
