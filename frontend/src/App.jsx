import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, RoleProtectedRoute } from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import PricingAnalytics from "./pages/PricingAnalytics";
import PricePrediction from "./pages/PricePrediction";
import DemandForecasting from "./pages/DemandForecasting";
import CompetitorAnalysis from "./pages/CompetitorAnalysis";
import CustomerAnalytics from "./pages/CustomerAnalytics";
import RevenueOptimization from "./pages/RevenueOptimization";
import EDA from "./pages/EDA";
import AIRecommendations from "./pages/AIRecommendations";
import AIAlerts from "./pages/AIAlerts";
import Copilot from "./pages/Copilot";
import BIReports from "./pages/BIReports";
import ReportHistory from "./pages/ReportHistory";
import ModelPerformance from "./pages/ModelPerformance";
import UserManagement from "./pages/UserManagement";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";

const ALL = ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST", "VIEWER"];
const STAFF = ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST"];
const MANAGER = ["ADMIN", "BUSINESS_MANAGER"];
const ANALYST = ["ADMIN", "BUSINESS_ANALYST"];

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />

              <Route element={<RoleProtectedRoute roles={ALL} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:productId" element={<ProductDetail />} />
                <Route path="/reports/bi" element={<BIReports />} />
                <Route path="/reports/history" element={<ReportHistory />} />
                <Route path="/admin/models" element={<ModelPerformance />} />
                <Route path="/admin/settings" element={<Settings />} />
              </Route>

              <Route element={<RoleProtectedRoute roles={STAFF} />}>
                <Route path="/pricing/analytics" element={<PricingAnalytics />} />
                <Route path="/pricing/prediction" element={<PricePrediction />} />
                <Route path="/forecasting/demand" element={<DemandForecasting />} />
                <Route path="/market/competitors" element={<CompetitorAnalysis />} />
                <Route path="/market/customers" element={<CustomerAnalytics />} />
                <Route path="/ai/recommendations" element={<AIRecommendations />} />
                <Route path="/ai/alerts" element={<AIAlerts />} />
                <Route path="/ai/copilot" element={<Copilot />} />
              </Route>

              <Route element={<RoleProtectedRoute roles={MANAGER} />}>
                <Route path="/revenue/optimization" element={<RevenueOptimization />} />
              </Route>

              <Route element={<RoleProtectedRoute roles={ANALYST} />}>
                <Route path="/data/eda" element={<EDA />} />
              </Route>

              <Route element={<RoleProtectedRoute roles={["ADMIN"]} />}>
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/audit" element={<AuditLogs />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
