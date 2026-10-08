import React from "react";
import { 
  LayoutDashboard, 
  Package, 
  Calculator, 
  CalendarRange, 
  Crosshair, 
  BarChart4, 
  FileText,
  Bot, 
  FileClock, 
  Settings, 
  LogOut, 
  Sparkles, 
  TrendingUp,
  Shield
} from "lucide-react";

function Sidebar({ activeTab, onSelectTab, user, onLogout }) {
  const navItems = [
    { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "products", label: "Products", icon: <Package size={18} /> },
    { id: "predict", label: "Pricing ML Engine", icon: <Calculator size={18} /> },
    { id: "forecast", label: "Demand Forecast", icon: <CalendarRange size={18} /> },
    { id: "competitor", label: "Competitor Intel", icon: <Crosshair size={18} /> },
    { id: "optimize", label: "Revenue Simulator", icon: <BarChart4 size={18} /> },
    { id: "reports", label: "Reports & Export", icon: <FileText size={18} />, badge: "CSV" },
    { id: "ai_assistant", label: "AI Copilot", icon: <Bot size={18} />, badge: "AI" },
    { id: "audit", label: "Audit Trail", icon: <FileClock size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <aside className="dashboard-sidebar">
      <div>
        <div className="sidebar-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="brand-icon" style={{ width: 32, height: 32, borderRadius: 8 }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 800 }}>PricePilot AI</h4>
              <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.05em" }}>WORKSPACE</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => onSelectTab(item.id)}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ 
                  fontSize: 10, 
                  fontWeight: 700, 
                  background: 'rgba(16, 185, 129, 0.2)', 
                  color: 'var(--accent-emerald)', 
                  padding: '2px 6px', 
                  borderRadius: 4 
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar">
            {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-info" style={{ overflow: "hidden" }}>
            <h5 style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {user?.username || "Guest User"}
            </h5>
            <span className="user-role-tag">
              {user?.role || "ADMIN"}
            </span>
          </div>
        </div>

        <button 
          className="btn btn-outline btn-sm" 
          onClick={onLogout}
          style={{ width: "100%", justifyContent: "flex-start", gap: 8 }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
