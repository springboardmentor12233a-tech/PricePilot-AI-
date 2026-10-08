import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Database, 
  Server, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  Cpu, 
  Lock, 
  FileText 
} from "lucide-react";
import { getUsers, checkHealth } from "../../api";

function SettingsTab({ user }) {
  const [usersList, setUsersList] = useState([]);
  const [apiHealthy, setApiHealthy] = useState(true);

  useEffect(() => {
    checkHealth()
      .then(() => setApiHealthy(true))
      .catch(() => setApiHealthy(false));

    if (user?.role === "ADMIN") {
      getUsers()
        .then(data => setUsersList(data))
        .catch(() => {
          setUsersList([
            { id: 1, username: "admin_test", email: "admin.test@example.com", role: "ADMIN", is_active: true },
            { id: 2, username: "pricing_lead", email: "pricing.lead@example.com", role: "PRICING_MANAGER", is_active: true },
            { id: 3, username: "analyst_demo", email: "analyst@example.com", role: "ANALYST", is_active: true }
          ]);
        });
    }
  }, [user]);

  const permissions = [
    { module: "Executive Dashboard", admin: true, manager: true, analyst: true, customer: false },
    { module: "Product Catalog View", admin: true, manager: true, analyst: true, customer: true },
    { module: "Product Create / Edit / Delete", admin: true, manager: true, analyst: false, customer: false },
    { module: "ML Pricing Demand Prediction", admin: true, manager: true, analyst: true, customer: false },
    { module: "Forecasting & Seasonality", admin: true, manager: true, analyst: true, customer: false },
    { module: "Competitor Market Benchmarking", admin: true, manager: true, analyst: true, customer: false },
    { module: "Revenue What-If Simulator", admin: true, manager: true, analyst: true, customer: false },
    { module: "Audit Logs Viewer", admin: true, manager: false, analyst: false, customer: false },
    { module: "User Management", admin: true, manager: false, analyst: false, customer: false },
  ];

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>System Configuration & Access Control</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Backend diagnostics, machine learning model registries, and role-based permissions.
        </p>
      </div>

      {/* Diagnostics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div className="glass-panel" style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Server size={20} color="#10b981" />
            <h4 style={{ fontSize: 16, fontWeight: 700 }}>FastAPI Backend Engine</h4>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Status: <strong style={{ color: apiHealthy ? "#10b981" : "#fb7185" }}>{apiHealthy ? "Online & Healthy" : "Offline / Mock Active"}</strong><br />
            Endpoint: <code style={{ color: "var(--accent-cyan)", fontSize: 11 }}>http://127.0.0.1:8000</code><br />
            Auth Protocol: OAuth2 Password Bearer JWT
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Database size={20} color="#6366f1" />
            <h4 style={{ fontSize: 16, fontWeight: 700 }}>Database & Schema</h4>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Engine: PostgreSQL / SQLAlchemy ORM<br />
            Tables: Users, Products, AuditLogs<br />
            Connection Pooling: Active
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Cpu size={20} color="#38bdf8" />
            <h4 style={{ fontSize: 16, fontWeight: 700 }}>Machine Learning Registry</h4>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Pricing Regressor: <code style={{ color: "var(--accent-emerald)", fontSize: 11 }}>pricepilot_xgb_model.pkl</code><br />
            Demand Forecaster: <code style={{ color: "var(--accent-indigo)", fontSize: 11 }}>pricepilot_demand_forecast_model.pkl</code><br />
            Pipeline: Preprocessor Scaler & OneHotEncoder
          </div>
        </div>
      </div>

      {/* Role-Based Permissions Matrix */}
      <div className="table-container" style={{ marginBottom: "32px" }}>
        <div className="table-header-bar">
          <h3 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={16} color="#10b981" />
            Role-Based Access Control (RBAC) Matrix
          </h3>
          <span className="badge-glow">Current User Role: {user?.role || "ADMIN"}</span>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>System Module</th>
              <th style={{ textAlign: "center" }}>ADMIN</th>
              <th style={{ textAlign: "center" }}>PRICING_MANAGER</th>
              <th style={{ textAlign: "center" }}>ANALYST</th>
              <th style={{ textAlign: "center" }}>CUSTOMER</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((p, idx) => (
              <tr key={idx}>
                <td><strong>{p.module}</strong></td>
                <td style={{ textAlign: "center" }}>
                  {p.admin ? <CheckCircle2 size={16} color="#10b981" style={{ display: "inline" }} /> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
                <td style={{ textAlign: "center" }}>
                  {p.manager ? <CheckCircle2 size={16} color="#10b981" style={{ display: "inline" }} /> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
                <td style={{ textAlign: "center" }}>
                  {p.analyst ? <CheckCircle2 size={16} color="#10b981" style={{ display: "inline" }} /> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
                <td style={{ textAlign: "center" }}>
                  {p.customer ? <CheckCircle2 size={16} color="#10b981" style={{ display: "inline" }} /> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Accounts Management (for Admin) */}
      {user?.role === "ADMIN" && usersList.length > 0 && (
        <div className="table-container">
          <div className="table-header-bar">
            <h3 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={16} color="#38bdf8" />
              Registered User Accounts ({usersList.length})
            </h3>
            <span className="tag-badge active">Admin Privileges Active</span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Username</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td><strong>{u.username}</strong></td>
                  <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                  <td>
                    <span className="user-role-tag">{u.role}</span>
                  </td>
                  <td>
                    <span className="stock-tag stock-in">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SettingsTab;
