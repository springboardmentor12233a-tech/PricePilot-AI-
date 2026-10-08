// Role-Based Access Control (RBAC) Matrix & Permission Utilities

export const ROLE_PERMISSIONS = {
  ADMIN: {
    canViewDashboard: true,
    canViewProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canAddProducts: true,
    canRunPrediction: true,
    canViewForecast: true,
    canViewCompetitors: true,
    canRunSimulations: true,
    canExportReports: true,
    canViewAuditLogs: true,
    canManageUsers: true,
    canEditSettings: true,
  },
  PRICING_MANAGER: {
    canViewDashboard: true,
    canViewProducts: true,
    canEditProducts: true,
    canDeleteProducts: false, // Protected: Only Admin can delete
    canAddProducts: true,
    canRunPrediction: true,
    canViewForecast: true,
    canViewCompetitors: true,
    canRunSimulations: true,
    canExportReports: true,
    canViewAuditLogs: false, // Protected
    canManageUsers: false,  // Protected
    canEditSettings: false, // Protected
  },
  ANALYST: {
    canViewDashboard: true,
    canViewProducts: true,
    canEditProducts: false, // Read only
    canDeleteProducts: false,
    canAddProducts: false,
    canRunPrediction: true,
    canViewForecast: true,
    canViewCompetitors: true,
    canRunSimulations: true,
    canExportReports: true,
    canViewAuditLogs: false,
    canManageUsers: false,
    canEditSettings: false,
  },
  CUSTOMER: {
    canViewDashboard: true,
    canViewProducts: true,
    canEditProducts: false,
    canDeleteProducts: false,
    canAddProducts: false,
    canRunPrediction: false, // Restricted
    canViewForecast: false,   // Restricted
    canViewCompetitors: false,
    canRunSimulations: false,
    canExportReports: false,
    canViewAuditLogs: false,
    canManageUsers: false,
    canEditSettings: false,
  },
};

export function checkPermission(userRole, action) {
  const role = (userRole || "ANALYST").toUpperCase();
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.ANALYST;
  return !!perms[action];
}
