import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import StatCards from "./components/StatCards";
import ProductCatalog from "./components/ProductCatalog";
import PriceRecommendationModal from "./components/PriceRecommendationModal";
import DemandForecastingView from "./components/DemandForecastingView";
import CompetitorIntelligenceView from "./components/CompetitorIntelligenceView";
import SettingsView from "./components/SettingsView";
import HeroSection from "./components/HeroSection";
import PredictionPage from "./components/PredictionPage";
import CustomerQueryChatbot from "./components/CustomerQueryChatbot";
import { fetchProducts, fetchSummary, fetchHealth } from "./services/api";
import {
  Sparkles,
  Layers,
  TrendingUp,
  Users2,
  ShieldCheck,
  Lock,
  Activity,
  ArrowRight,
} from "lucide-react";

export default function App() {
  const [role, setRole] = useState("pricing_manager"); // 'pricing_manager' | 'business_user'
  const [activePage, setActivePage] = useState("home"); // 'home' | 'prediction' | 'dashboard'
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [forecastProductId, setForecastProductId] = useState(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const healthRes = await fetchHealth();
      setIsLiveBackend(healthRes.isLive);

      const productsRes = await fetchProducts();
      setProducts(productsRes.data);

      const summaryRes = await fetchSummary();
      setSummary(summaryRes.data);

      setLoading(false);
    }
    init();
  }, []);

  const handleOpenForecast = (productId) => {
    setForecastProductId(productId);
    setActivePage("dashboard");
    setActiveTab("forecasting");
  };

  const handleOpenPredictor = (productId) => {
    setSelectedProductId(productId);
    setActivePage("prediction");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        role={role}
        setRole={setRole}
        isLiveBackend={isLiveBackend}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* Page 1: Hero Section Landing Page */}
      {activePage === "home" && (
        <div className="flex-1">
          <HeroSection
            onNavigatePrediction={() => setActivePage("prediction")}
            onNavigateDashboard={() => setActivePage("dashboard")}
          />
        </div>
      )}

      {/* Page 2: Dedicated AI Price Prediction Page */}
      {activePage === "prediction" && (
        <div className="flex-1 overflow-y-auto bg-slate-950">
          <PredictionPage
            products={products}
            role={role}
            onNavigateDashboard={() => setActivePage("dashboard")}
          />
        </div>
      )}

      {/* Page 3: Management & Analytics Dashboard */}
      {activePage === "dashboard" && (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            role={role}
            counts={{ products: products.length }}
          />

          {/* Content Area */}
          <main className="flex-1 p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Tab: Dashboard / Overview */}
              {activeTab === "dashboard" && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                        <span>Executive Pricing Intelligence</span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Live Dashboard
                        </span>
                      </h1>
                      <p className="text-xs text-slate-400 mt-1">
                        Continuous dynamic price optimization, competitor
                        benchmarking, and elasticity scoring.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActivePage("prediction")}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Open Prediction Engine</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <StatCards
                    summary={summary}
                    productsCount={products.length}
                  />

                  {/* Main Product Table */}
                  <ProductCatalog
                    products={products}
                    onSelectProduct={handleOpenPredictor}
                    onOpenForecast={handleOpenForecast}
                    role={role}
                    searchQuery={searchQuery}
                  />
                </>
              )}

              {/* Tab: Products */}
              {activeTab === "products" && (
                <div>
                  <ProductCatalog
                    products={products}
                    onSelectProduct={handleOpenPredictor}
                    onOpenForecast={handleOpenForecast}
                    role={role}
                    searchQuery={searchQuery}
                  />
                </div>
              )}

              {/* Tab: AI Price Engine / Recommendations */}
              {activeTab === "recommendations" && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 backdrop-blur-md">
                    <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      AI Pricing Recommendation Engine
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Select any product below to review AI-recommended target
                      pricing, competitor benchmarks, and elasticity
                      simulations.
                    </p>
                  </div>

                  <ProductCatalog
                    products={products}
                    onSelectProduct={handleOpenPredictor}
                    onOpenForecast={handleOpenForecast}
                    role={role}
                    searchQuery={searchQuery}
                  />
                </div>
              )}

              {/* Tab: Competitor Intel */}
              {activeTab === "competitors" && (
                <CompetitorIntelligenceView
                  products={products}
                  onSelectProduct={handleOpenPredictor}
                />
              )}

              {/* Tab: Demand Forecasting */}
              {activeTab === "forecasting" && (
                <DemandForecastingView
                  products={products}
                  initialProductId={forecastProductId}
                />
              )}

              {/* Tab: Settings */}
              {activeTab === "settings" && (
                <SettingsView isLiveBackend={isLiveBackend} />
              )}
            </div>
          </main>
        </div>
      )}

      {/* Dynamic Pricing Recommendation Modal (if modal view is invoked) */}
      {selectedProductId && activePage === "dashboard" && (
        <PriceRecommendationModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          role={role}
        />
      )}

      {/* Floating Customer Query Chatbot Popup */}
      <CustomerQueryChatbot />
    </div>
  );
}
