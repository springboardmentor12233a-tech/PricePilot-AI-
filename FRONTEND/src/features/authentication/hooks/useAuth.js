import { useAuthContext, AuthProvider } from '../context/AuthContext';

/**
 * Hook to access authentication state and operations
 * Conceptually provides:
 * const { user, isAuthenticated, isLoading, error, login, register, logout, loadCurrentUser } = useAuth();
 */
export function useAuth() {
  return useAuthContext();
}

export { AuthProvider };
export default useAuth;
