import React from "react";
import { useAuth } from "../context/AuthContext";

function Navbar({ activePage }) {

  // Get logged-in user
  const { user } = useAuth();

  return (
    <header className="navbar">

      <div className="navbar-left">

        <div>
          <h1>{activePage}</h1>

          <p>
            Monitor pricing, demand and business performance
          </p>
        </div>

      </div>


      <div className="navbar-right">

        {/* Search */}
        <div className="navbar-search">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Search..."
          />

        </div>


        {/* Notification */}
        <button className="navbar-button notification-button">

          🔔

          <span className="notification-dot"></span>

        </button>


        {/* Profile */}
        <div className="navbar-profile">

          <div className="navbar-avatar">

            {user?.username
              ? user.username.charAt(0).toUpperCase()
              : "U"}

          </div>


          <div className="navbar-user">

            <strong>
              {user?.username || "User"}
            </strong>

            <span>
              {user?.role || "User"}
            </span>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Navbar;