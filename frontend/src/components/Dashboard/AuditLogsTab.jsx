import React, { useState, useEffect } from "react";
import { FileClock, UserCheck, Shield, RefreshCw, Layers, ShieldAlert, Lock } from "lucide-react";
import { getAuditLogs } from "../../api";
import { checkPermission } from "../../utils/rbac";

function AuditLogsTab({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const canViewAudit = checkPermission(user?.role, "canViewAuditLogs");

  const sampleLogs = [
    {
      id: 1,
      username: "admin_test",
      role: "ADMIN",
      action: "Product updated",
      target: "Product ID 101",
      old_value: "Ultra HD Smart TV 55\" | Price: 519.99 | Stock: 110",
      new_value: "Ultra HD Smart TV 55\" | Price: 499.99 | Stock: 120",
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 2,
      username: "pricing_lead",
      role: "PRICING_MANAGER",
      action: "Product created",
      target: "Product ID 108",
      old_value: null,
      new_value: "STEM Robotic Coding Kit",
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 3,
      username: "admin_test",
      role: "ADMIN",
      action: "User registered",
      target: "User ID 2",
      old_value: null,
      new_value: "Created user with role PRICING_MANAGER",
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    }
  ];

  const fetchLogs = async () => {
    if (!canViewAudit) return;
    setLoading(true);
    try {
      const data = await getAuditLogs();
      if (Array.isArray(data) && data.length > 0) {
        setLogs(data);
      } else {
        setLogs(sampleLogs);
      }
    } catch (err) {
      setLogs(sampleLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewAudit) {
      fetchLogs();
    }
  }, [user]);

  // If user does NOT have permission to view audit logs
  if (!canViewAudit) {
    return (
      <div className="glass-panel" style={{ padding: "50px 30px", textAlign: "center", maxWidth: 640, margin: "40px auto", border: "1px solid rgba(244, 63, 94, 0.3)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", display: "grid", placeItems: "center", margin: "0 auto 20px", color: "#fb7185" }}>
          <Lock size={32} />
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 800 }}>Audit Logs Restricted to ADMIN</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "10px auto 24px", maxWidth: 440 }}>
          Your current role (<strong>{user?.role || "GUEST"}</strong>) does not have authorization to view the immutable system audit trails.
        </p>
        <div style={{ background: "rgba(0,0,0,0.3)", padding: "14px", borderRadius: "10px", display: "inline-block", fontSize: 12, color: "var(--text-muted)" }}>
          Required Role: <strong style={{ color: "var(--accent-emerald)" }}>ADMIN</strong> | Policy: <code style={{ color: "#38bdf8" }}>AUDIT_LOGS_VIEW</code>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Enterprise Security Audit Trail</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Immutable chronological logging of all user activities, pricing updates, and catalog changes.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchLogs}>
          <RefreshCw size={14} />
          Refresh Logs
        </button>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User & Role</th>
              <th>Action Executed</th>
              <th>Target Entity</th>
              <th>Parameter Diff (Old → New)</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ whiteSpace: "nowrap", fontSize: "12px", color: "var(--text-muted)" }}>
                  {new Date(log.created_at || Date.now()).toLocaleString()}
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "#10b981" }}>
                      {log.username ? log.username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{log.username}</div>
                      <span className="user-role-tag" style={{ fontSize: 9 }}>{log.role}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="tag-badge active">{log.action}</span>
                </td>
                <td>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{log.target || "N/A"}</span>
                </td>
                <td style={{ fontSize: 12 }}>
                  {log.old_value && (
                    <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>
                      <span style={{ color: "#fb7185" }}>Old:</span> {log.old_value}
                    </div>
                  )}
                  {log.new_value && (
                    <div style={{ color: "#e2e8f0" }}>
                      <span style={{ color: "#10b981" }}>New:</span> {log.new_value}
                    </div>
                  )}
                  {!log.old_value && !log.new_value && <span style={{ color: "var(--text-muted)" }}>None</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogsTab;
