// ==========================================
// 📦 AUTH COMPONENTS INDEX - CENTRALIZED EXPORTS
// ==========================================

// Route Protection Components
export { default as ProtectedRoute } from './ProtectedRoute';
export { RoleGuard, PermissionGuard, GuestOnly } from './ProtectedRoute';

// Export component types
export type {
  ProtectedRouteProps,
  RoleGuardProps, 
  PermissionGuardProps,
  GuestOnlyProps
} from './ProtectedRoute';

// Utility hooks
export { useRouteGuard } from './ProtectedRoute';