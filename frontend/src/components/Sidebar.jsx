import React from "react";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  {
    name: "Dashboard",
    icon: "▦",
    roles: ["Admin", "Business Analyst", "User"],
  },
  {
    name: "Product Analytics",
    icon: "▤",
    roles: ["Admin", "Business Analyst", "User"],
  },
  {
    name: "Price Prediction",
    icon: "₹",
    roles: ["Admin", "Business Analyst"],
  },
  {
    name: "Demand Forecast",
    icon: "↗",
    roles: ["Admin", "Business Analyst"],
  },

  // Business Analyst only
  {
    name: "Competitor Analysis",
    icon: "◎",
    roles: ["Business Analyst"],
  },
  {
    name: "AI Recommendations",
    icon: "✦",
    roles: ["Business Analyst"],
  },
  {
    name: "BI Reports",
    icon: "▥",
    roles: ["Business Analyst"],
  },
];

function Sidebar({ activePage, setActivePage }) {
  const { user, logout } = useAuth();

  const rawRole = user?.role || "User";

  const userRole = rawRole
    .toLowerCase()
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          P
        </div>

        <div>
          <h2>PricePilot</h2>
          <span>AI</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="sidebar-section">

        <p className="sidebar-title">
          MAIN MENU
        </p>

        <nav>
          {visibleMenuItems.map((item) => (
            <button
              key={item.name}
              className={`sidebar-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>
            </button>
          ))}
        </nav>

      </div>

      {/* Bottom Navigation */}
      <div className="sidebar-bottom">

        {/* Logout */}
        <button
          className="sidebar-item logout-button"
          onClick={logout}
        >
          <span className="sidebar-icon">
            ↪
          </span>

          <span>
            Logout
          </span>
        </button>

      </div>

      {/* Profile */}
      <div className="sidebar-profile">

        <div className="profile-avatar">
          {user?.username
            ? user.username.charAt(0).toUpperCase()
            : "U"}
        </div>

        <div className="profile-info">

          <strong>
            {user?.username || "User"}
          </strong>

          <span>
            {userRole}
          </span>

        </div>

        <button
          className="profile-menu"
          onClick={logout}
          title="Logout"
        >
          ⋮
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;