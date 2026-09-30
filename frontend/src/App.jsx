import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BusinessAnalystDashboard from "./pages/BusinessAnalystDashboard";
import UserDashboard from "./pages/UserDashboard";

import PricePrediction from "./pages/PricePrediction";
import ProductAnalytics from "./pages/ProductAnalytics";
import DemandForecasting from "./pages/DemandForecasting";
import CompetitorAnalysis from "./pages/CompetitorAnalysis";

// ============================================================
// AI RECOMMENDATIONS
// ============================================================

import AIInsights from "./pages/AIInsights";

// ============================================================
// BI REPORTS
// ============================================================

import BIReports from "./pages/BIReports";

// ============================================================
// AUTHENTICATION
// ============================================================

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";


// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute({ children }) {

  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}


// ============================================================
// PUBLIC ROUTE
// ============================================================

function PublicRoute({ children }) {

  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}


// ============================================================
// ROLE BASED DASHBOARD
// ============================================================

function RoleDashboard() {

  const { user } = useAuth();

  if (user?.role === "Admin") {
    return <AdminDashboard />;
  }

  if (user?.role === "Business Analyst") {
    return <BusinessAnalystDashboard />;
  }

  if (user?.role === "User") {
    return <UserDashboard />;
  }

  return <Dashboard />;
}


// ============================================================
// DASHBOARD LAYOUT
// ============================================================

function DashboardLayout({
  initialPage = "Dashboard",
}) {

  const [activePage, setActivePage] =
    React.useState(initialPage);


  // ==========================================================
  // RENDER ACTIVE PAGE
  // ==========================================================

  const renderPage = () => {

    // --------------------------------------------------------
    // DASHBOARD
    // --------------------------------------------------------

    if (activePage === "Dashboard") {
      return <RoleDashboard />;
    }


    // --------------------------------------------------------
    // PRODUCT ANALYTICS
    // --------------------------------------------------------

    if (activePage === "Product Analytics") {
      return <ProductAnalytics />;
    }


    // --------------------------------------------------------
    // PRICE PREDICTION
    // --------------------------------------------------------

    if (activePage === "Price Prediction") {
      return <PricePrediction />;
    }


    // --------------------------------------------------------
    // DEMAND FORECAST
    // --------------------------------------------------------

    if (activePage === "Demand Forecast") {
      return <DemandForecasting />;
    }


    // --------------------------------------------------------
    // COMPETITOR ANALYSIS
    // --------------------------------------------------------

    if (activePage === "Competitor Analysis") {
      return <CompetitorAnalysis />;
    }


    // --------------------------------------------------------
    // AI RECOMMENDATIONS
    // --------------------------------------------------------

    if (activePage === "AI Recommendations") {
      return <AIInsights />;
    }


    // --------------------------------------------------------
    // BI REPORTS
    // --------------------------------------------------------

    if (activePage === "BI Reports") {
      return <BIReports />;
    }


    // --------------------------------------------------------
    // AI ASSISTANT
    // --------------------------------------------------------

    if (activePage === "AI Assistant") {

      return (
        <div className="placeholder-page">

          <h2>
            AI Assistant
          </h2>

          <p>
            PricePilot AI chatbot will be
            implemented here.
          </p>

        </div>
      );
    }


    // --------------------------------------------------------
    // ALERTS
    // --------------------------------------------------------

    if (activePage === "Alerts") {

      return (
        <div className="placeholder-page">

          <h2>
            Alerts
          </h2>

          <p>
            AI-generated alerts will be
            displayed here.
          </p>

        </div>
      );
    }


    // --------------------------------------------------------
    // SETTINGS
    // --------------------------------------------------------

    if (activePage === "Settings") {

      return (
        <div className="placeholder-page">

          <h2>
            Settings
          </h2>

          <p>
            Application settings will be
            implemented here.
          </p>

        </div>
      );
    }


    // --------------------------------------------------------
    // FALLBACK
    // --------------------------------------------------------

    return <RoleDashboard />;
  };


  // ==========================================================
  // LAYOUT
  // ==========================================================

  return (

    <div className="app">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />


      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="main-area">

        {/* ===================================================
            NAVBAR
        =================================================== */}

        <Navbar
          activePage={activePage}
        />


        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <main className="page-content">

          {renderPage()}

        </main>

      </div>

    </div>
  );
}


// ============================================================
// APP ROUTES
// ============================================================

function AppRoutes() {

  return (

    <Routes>

      {/* =====================================================
          LOGIN
      ===================================================== */}

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />


      {/* =====================================================
          REGISTER
      ===================================================== */}

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />


      {/* =====================================================
          MAIN DASHBOARD
      ===================================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout
              initialPage="Dashboard"
            />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          PRODUCT ANALYTICS
      ===================================================== */}

      <Route
        path="/product-analytics"
        element={
          <ProtectedRoute>
            <DashboardLayout
              initialPage="Product Analytics"
            />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          PRICE PREDICTION
      ===================================================== */}

      <Route
        path="/price-prediction"
        element={
          <ProtectedRoute>
            <DashboardLayout
              initialPage="Price Prediction"
            />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          DEMAND FORECAST
      ===================================================== */}

      <Route
        path="/demand-forecast"
        element={
          <ProtectedRoute>
            <DashboardLayout
              initialPage="Demand Forecast"
            />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          COMPETITOR ANALYSIS
      ===================================================== */}

      <Route
        path="/competitor-analysis"
        element={
          <ProtectedRoute>
            <DashboardLayout
              initialPage="Competitor Analysis"
            />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          AI RECOMMENDATIONS
      ===================================================== */}

      <Route
        path="/ai-recommendations"
        element={
          <ProtectedRoute>
            <DashboardLayout
              initialPage="AI Recommendations"
            />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          BI REPORTS
      ===================================================== */}

      <Route
        path="/bi-reports"
        element={
          <ProtectedRoute>
            <DashboardLayout
              initialPage="BI Reports"
            />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          ROOT
      ===================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />


      {/* =====================================================
          UNKNOWN URL
      ===================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}


// ============================================================
// MAIN APP
// ============================================================

function App() {

  return (

    <AuthProvider>

      <AppRoutes />

    </AuthProvider>
  );
}


export default App;