import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/authentication/hooks/useAuth';
import { OrganizationProvider } from './features/organizations/context/OrganizationContext';
import { ToastProvider } from './components/Toast';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts & Guards
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Route-level code splitting for production performance
const LandingPage = lazy(() => import('./features/landing/pages/LandingPage'));
const LoginPage = lazy(() => import('./features/authentication/pages/LoginPage'));
const RegisterPage = lazy(() => import('./features/authentication/pages/RegisterPage'));

const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'));
const ProductsPage = lazy(() => import('./features/products/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./features/products/pages/ProductDetailPage'));
const CategoriesPage = lazy(() => import('./features/categories/pages/CategoriesPage'));
const InventoryPage = lazy(() => import('./features/inventory/pages/InventoryPage'));
const CompetitorsPage = lazy(() => import('./features/competitors/pages/CompetitorsPage'));
const CompetitorDetailPage = lazy(() => import('./features/competitors/pages/CompetitorDetailPage'));
const MarketIntelligencePage = lazy(() => import('./features/market-intelligence/pages/MarketIntelligencePage'));
const PricingPage = lazy(() => import('./features/pricing/pages/PricingPage'));
const RecommendationsPage = lazy(() => import('./features/recommendations/pages/RecommendationsPage'));
const ForecastPage = lazy(() => import('./features/forecasting/pages/ForecastPage'));
const RevenuePage = lazy(() => import('./features/revenue/pages/RevenuePage'));
const ProfitabilityPage = lazy(() => import('./features/profitability/pages/ProfitabilityPage'));
const RevenueSimulationPage = lazy(() => import('./features/revenue/pages/RevenueSimulationPage'));
const RevenueOptimizationPage = lazy(() => import('./features/revenue-optimization/pages/RevenueOptimizationPage'));
const PricingAnalyticsPage = lazy(() => import('./features/pricing-analytics/pages/PricingAnalyticsPage'));
const ReportsPage = lazy(() => import('./features/reports/pages/ReportsPage'));
const ExecutiveReportPage = lazy(() => import('./features/reports/pages/ExecutiveReportPage'));
const OrganizationPage = lazy(() => import('./features/organizations/pages/OrganizationPage'));
const TeamPage = lazy(() => import('./features/organizations/pages/TeamPage'));
const SettingsPage = lazy(() => import('./features/profile/pages/SettingsPage'));

const NotFoundPage = lazy(() => import('./components/NotFoundPage'));

// Accessible, smooth loading fallback
function PageLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] p-8 text-center" role="status">
      <LoadingSpinner size="lg" color="#2563EB" />
      <p className="mt-4 text-xs font-medium text-[#64748B] tracking-wide animate-pulse">
        Loading module...
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrganizationProvider>
          <ToastProvider>
            <ErrorBoundary>
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Protected SaaS Application Shell */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/dashboard" element={<DashboardPage />} />

                      {/* Catalog */}
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/:productId" element={<ProductDetailPage />} />
                      <Route path="/categories" element={<CategoriesPage />} />
                      <Route path="/inventory" element={<InventoryPage />} />

                      {/* Competitors & Intelligence */}
                      <Route path="/competitors" element={<CompetitorsPage />} />
                      <Route path="/competitors/:competitorId" element={<CompetitorDetailPage />} />
                      <Route path="/market-intelligence" element={<MarketIntelligencePage />} />
                      <Route path="/pricing" element={<PricingPage />} />
                      <Route path="/recommendations" element={<RecommendationsPage />} />
                      <Route path="/forecast" element={<ForecastPage />} />
                      <Route path="/forecasting" element={<ForecastPage />} />

                      {/* Revenue & Profitability */}
                      <Route path="/pricing-analytics" element={<PricingAnalyticsPage />} />
                      <Route path="/revenue" element={<RevenuePage />} />
                      <Route path="/profitability" element={<ProfitabilityPage />} />
                      <Route path="/revenue-simulation" element={<RevenueSimulationPage />} />
                      <Route path="/revenue-optimization" element={<RevenueOptimizationPage />} />

                      {/* Reports */}
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/executive" element={<ExecutiveReportPage />} />

                      {/* Administration & Account */}
                      <Route path="/organization" element={<OrganizationPage />} />
                      <Route path="/team" element={<TeamPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                  </Route>

                  {/* 404 Fallback */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
          </ErrorBoundary>
        </ToastProvider>
        </OrganizationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
