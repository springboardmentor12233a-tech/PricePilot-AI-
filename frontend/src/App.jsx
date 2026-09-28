import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import StatCards from "./components/StatCards";
import ProductCatalog from "./components/ProductCatalog";
import PriceRecommendationModal from "./components/PriceRecommendationModal";
import DemandForecastingView from "./components/DemandForecastingView";
import CompetitorIntelligenceView from "./components/CompetitorIntelligenceView";
import AiInsightsView from "./components/AiInsightsView";
import AlertsView from "./components/AlertsView";
import BiReportsView from "./components/BiReportsView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";
import HeroSection from "./components/HeroSection";
import PredictionPage from "./components/PredictionPage";
import CustomerQueryChatbot from "./components/CustomerQueryChatbot";
import AuthModal from "./components/AuthModal";
import {
  fetchProducts,
  fetchSummary,
  fetchHealth,
  fetchMe,
  logoutUser,
} from "./services/api";
import {
  Sparkles,
  Layers,
  TrendingUp,
  Users2,
  ShieldCheck,
  UserCheck,
  Lock,
  Activity,
  ArrowRight,
  LogIn,
  KeyRound,
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("pricepilot_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [forecastProductId, setForecastProductId] = useState(null);

  useEffect(() => {
    async function checkAuthAndLoad() {
      setLoading(true);

      try {
        const authRes = await fetchMe();
        if (authRes.user) {
          setCurrentUser(authRes.user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      }

      const healthRes = await fetchHealth();
      setIsLiveBackend(healthRes.isLive);

      const productsRes = await fetchProducts();
      setProducts(productsRes.data);

      const summaryRes = await fetchSummary();
      setSummary(summaryRes.data);

      setLoading(false);
    }
    checkAuthAndLoad();
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setActivePage("home");
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleNavigateProtected = (targetPage) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setActivePage(targetPage);
  };

  const handleOpenForecast = (productId) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setForecastProductId(productId);
    setActivePage("dashboard");
    setActiveTab("forecasting");
  };

  const handleOpenPredictor = (productId) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedProductId(productId);
    setActivePage("prediction");
  };

  const userRole = currentUser?.role || "guest";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isLiveBackend={isLiveBackend}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activePage={activePage}
        setActivePage={(page) => {
          if ((page === "prediction" || page === "dashboard") && !currentUser) {
            setIsAuthModalOpen(true);
            return;
          }
          setActivePage(page);
        }}
      />

      {activePage === "home" && (
        <div className="flex-1 flex flex-col">
          {!currentUser && (
            <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-900/60 border-b border-indigo-800/40 px-4 py-2.5 text-center text-xs flex items-center justify-center gap-3">
              <span className="text-indigo-300 flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Enterprise Authentication Required: Sign in to unlock ML forecasting, competitor feeds, and price approval.</span>
              </span>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-sm shadow-indigo-600/30"
              >
                Sign In / Demo
              </button>
            </div>
          )}

          <HeroSection
            onNavigatePrediction={() => handleNavigateProtected("prediction")}
            onNavigateDashboard={() => handleNavigateProtected("dashboard")}
          />
        </div>
      )}

      {activePage === "prediction" && (
        <div className="flex-1 overflow-y-auto bg-slate-950">
          {!currentUser ? (
            <div className="min-h-[80vh] flex items-center justify-center p-6">
              <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-5 shadow-2xl backdrop-blur-md">
                <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Authentication Required
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    AI Price Prediction requires an authorized session. Sign in as a <strong>Pricing Manager</strong> to approve price changes or as a <strong>Business Analyst</strong> to review elasticity models.
                  </p>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Demo Account</span>
                </button>
              </div>
            </div>
          ) : (
            <PredictionPage
              products={products}
              role={userRole}
              onNavigateDashboard={() => setActivePage("dashboard")}
            />
          )}
        </div>
      )}

      {activePage === "dashboard" && (
        <div className="flex-1 flex overflow-hidden">
          {!currentUser ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-5 shadow-2xl backdrop-blur-md">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Executive Console Restricted
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Access to catalog telemetry, competitor tracking matrices, and multi-horizon demand forecasting is protected by Enterprise RBAC.
                  </p>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Select Demo Profile</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                role={userRole}
                counts={{ products: products.length }}
              />

              <main className="flex-1 p-6 sm:p-8 overflow-y-auto bg-slate-950">
                <div className="max-w-7xl mx-auto space-y-6">
                  <div className="p-3.5 px-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {userRole === "pricing_manager" ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-indigo-400" />
                          <span className="text-slate-300">
                            Logged in as <strong className="text-white">{currentUser.full_name || currentUser.email}</strong> (Pricing Manager): <span className="text-indigo-400 font-semibold">Full Price Strategy & Approval Authority</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-slate-300">
                            Logged in as <strong className="text-white">{currentUser.full_name || currentUser.email}</strong> (Business Analyst): <span className="text-emerald-400 font-semibold">Read-Only BI & Market Intelligence View</span>
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                      Session Active
                    </span>
                  </div>

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
                            Continuous dynamic price optimization, competitor benchmarking, and elasticity scoring.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActivePage("prediction")}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Open Prediction Engine</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <StatCards
                        summary={summary}
                        productsCount={products.length}
                      />

                      <ProductCatalog
                        products={products}
                        onSelectProduct={handleOpenPredictor}
                        onOpenForecast={handleOpenForecast}
                        role={userRole}
                        searchQuery={searchQuery}
                      />
                    </>
                  )}

                  {activeTab === "products" && (
                    <div>
                      <ProductCatalog
                        products={products}
                        onSelectProduct={handleOpenPredictor}
                        onOpenForecast={handleOpenForecast}
                        role={userRole}
                        searchQuery={searchQuery}
                      />
                    </div>
                  )}

                  {activeTab === "recommendations" && (
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 backdrop-blur-md">
                        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-400" />
                          Price Prediction & Recommendations
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          Select any product below to review AI-predicted target pricing, competitor benchmarks, and elasticity simulations.
                        </p>
                      </div>

                      <ProductCatalog
                        products={products}
                        onSelectProduct={handleOpenPredictor}
                        onOpenForecast={handleOpenForecast}
                        role={userRole}
                        searchQuery={searchQuery}
                      />
                    </div>
                  )}

                  {(activeTab === "market_analysis" || activeTab === "competitors") && (
                    <CompetitorIntelligenceView
                      products={products}
                      onSelectProduct={handleOpenPredictor}
                    />
                  )}

                  {activeTab === "ai_insights" && (
                    <AiInsightsView
                      products={products}
                      onSelectProduct={handleOpenPredictor}
                    />
                  )}

                  {activeTab === "alerts" && (
                    <AlertsView
                      onSelectProduct={handleOpenPredictor}
                    />
                  )}

                  {activeTab === "bi_reports" && (
                    <BiReportsView
                      products={products}
                      summary={summary}
                    />
                  )}

                  {activeTab === "analytics" && (
                    <AnalyticsView
                      products={products}
                      onSelectProduct={handleOpenPredictor}
                    />
                  )}

                  {activeTab === "forecasting" && (
                    <DemandForecastingView
                      products={products}
                      initialProductId={forecastProductId}
                    />
                  )}

                  {activeTab === "settings" && (
                    <SettingsView isLiveBackend={isLiveBackend} />
                  )}
                </div>
              </main>
            </>
          )}
        </div>
      )}

      {selectedProductId && activePage === "dashboard" && (
        <PriceRecommendationModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          role={userRole}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <CustomerQueryChatbot />
    </div>
  );
}
