import React, { useState, useEffect } from "react";
import Sidebar from "./components/Dashboard/Sidebar";
import OverviewTab from "./components/Dashboard/OverviewTab";
import ProductsTab from "./components/Dashboard/ProductsTab";
import PredictTab from "./components/Dashboard/PredictTab";
import ForecastTab from "./components/Dashboard/ForecastTab";
import CompetitorTab from "./components/Dashboard/CompetitorTab";
import OptimizationTab from "./components/Dashboard/OptimizationTab";
import ReportsTab from "./components/Dashboard/ReportsTab";
import AIAssistantTab from "./components/Dashboard/AIAssistantTab";
import AuditLogsTab from "./components/Dashboard/AuditLogsTab";
import SettingsTab from "./components/Dashboard/SettingsTab";
import AIGuideModal from "./components/AIGuideModal";
import { getDashboardData, getProducts, logout as apiLogout } from "./api";
import { EXECUTIVE_KPIS, INITIAL_SAMPLE_PRODUCTS } from "./data/intelligenceData";
import { ArrowLeft, Bell, Search, Shield, Sparkles, BookOpen } from "lucide-react";

function Dashboard({ user, onLogout, onReturnHome }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState(EXECUTIVE_KPIS);
  const [products, setProducts] = useState(INITIAL_SAMPLE_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Load real dashboard data and product catalog
  useEffect(() => {
    getDashboardData()
      .then((data) => {
        if (data && data.total_revenue) {
          setDashboardData(data);
        }
      })
      .catch(() => {
        setDashboardData(EXECUTIVE_KPIS);
      });

    getProducts()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {
        setProducts(INITIAL_SAMPLE_PRODUCTS);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, []);

  const handleLogout = () => {
    apiLogout();
    onLogout();
  };

  const tabTitles = {
    overview: "Dashboard & KPIs",
    products: "Product Catalog Management",
    predict: "Pricing ML Engine (XGBoost)",
    forecast: "Demand Forecasting & Seasonality",
    competitor: "Competitor Market Benchmarking",
    optimize: "Revenue Optimization Simulator",
    reports: "Executive Reports & CSV Export",
    ai_assistant: "AI Intelligence Copilot",
    audit: "Security Audit Trail",
    settings: "System Diagnostics & RBAC",
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Topbar */}
        <header className="dashboard-topbar">
          <div className="topbar-breadcrumb">
            <button 
              className="btn btn-outline btn-sm" 
              onClick={onReturnHome}
              style={{ padding: "4px 10px", fontSize: 12, marginRight: 8 }}
            >
              <ArrowLeft size={13} />
              Portal Home
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>{tabTitles[activeTab] || "Dashboard"}</strong>
          </div>

          <div className="topbar-actions">
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => setIsGuideOpen(true)}
              style={{ background: "rgba(16, 185, 129, 0.12)", color: "var(--accent-emerald)", borderColor: "rgba(16, 185, 129, 0.3)" }}
            >
              <BookOpen size={14} />
              <span>AI User Guide</span>
            </button>

            <div className="nav-status-pill">
              <span className="status-dot online"></span>
              <span>FastAPI Connected</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: "10px", border: "1px solid var(--border-light)" }}>
              <Shield size={14} color="#10b981" />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{user?.role || "ADMIN"}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <main className="dashboard-content-area">
          {activeTab === "overview" && (
            <OverviewTab 
              dashboardData={dashboardData} 
              products={products}
              onNavigate={(tab) => setActiveTab(tab)} 
            />
          )}

          {activeTab === "products" && (
            <ProductsTab 
              user={user} 
              products={products} 
              setProducts={setProducts} 
            />
          )}

          {activeTab === "predict" && (
            <PredictTab user={user} products={products} />
          )}

          {activeTab === "forecast" && (
            <ForecastTab products={products} />
          )}

          {activeTab === "competitor" && (
            <CompetitorTab products={products} />
          )}

          {activeTab === "optimize" && (
            <OptimizationTab products={products} />
          )}

          {activeTab === "reports" && (
            <ReportsTab 
              products={products} 
              dashboardData={dashboardData} 
              user={user} 
            />
          )}

          {activeTab === "ai_assistant" && (
            <AIAssistantTab user={user} products={products} />
          )}

          {activeTab === "audit" && (
            <AuditLogsTab user={user} />
          )}

          {activeTab === "settings" && (
            <SettingsTab user={user} />
          )}
        </main>
      </div>

      {/* AI Interactive Guide Modal */}
      <AIGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}

export default Dashboard;