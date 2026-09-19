import { useOrganizationContext } from '../context/OrganizationContext';

/**
 * Hook to access organization state and operations
 * Usage:
 * const {
 *   organizations,
 *   selectedOrganization,
 *   selectedOrganizationId,
 *   isLoading,
 *   isSwitching,
 *   error,
 *   selectOrganization,
 *   refreshOrganizations,
 *   createOrganization,
 *   addMember
 * } = useOrganization();
 */
export function useOrganization() {
  return useOrganizationContext();
}

export default useOrganization;
