import React from "react";
import { ShieldAlert, X, Lock, ArrowRight, UserCheck } from "lucide-react";

function AccessDeniedModal({ isOpen, onClose, actionName, userRole, requiredRole = "ADMIN" }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-card" style={{ maxWidth: 460, border: "1px solid rgba(244, 63, 94, 0.4)", boxShadow: "0 25px 50px -12px rgba(244, 63, 94, 0.25)" }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", display: "grid", placeItems: "center", margin: "0 auto 16px", color: "#fb7185" }}>
            <ShieldAlert size={28} />
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc" }}>
            Access Restricted by RBAC
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>
            You are not allowed to perform this operation.
          </p>
        </div>

        <div style={{ background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
            Attempted Operation
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>
            {actionName || "Restricted System Action"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: 12 }}>
            <div style={{ background: "rgba(0,0,0,0.25)", padding: "10px", borderRadius: "8px" }}>
              <span style={{ color: "var(--text-muted)", display: "block", fontSize: 10 }}>YOUR CURRENT ROLE</span>
              <strong style={{ color: "#fb7185" }}>{userRole || "GUEST / ANALYST"}</strong>
            </div>
            <div style={{ background: "rgba(0,0,0,0.25)", padding: "10px", borderRadius: "8px" }}>
              <span style={{ color: "var(--text-muted)", display: "block", fontSize: 10 }}>REQUIRED PRIVILEGE</span>
              <strong style={{ color: "var(--accent-emerald)" }}>{requiredRole}</strong>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "22px", textAlign: "center" }}>
          Role-Based Access Control (RBAC) enforces security policies to protect product catalog data and system configurations. Please sign in with an authorized account or contact your administrator.
        </p>

        <button 
          className="btn btn-primary" 
          style={{ width: "100%", background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)", boxShadow: "0 4px 14px rgba(244, 63, 94, 0.35)" }}
          onClick={onClose}
        >
          <span>Understood / Acknowledge</span>
        </button>
      </div>
    </div>
  );
}

export default AccessDeniedModal;
