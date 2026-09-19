import { useOrganizationContext } from '../context/OrganizationContext';

/**
 * Hook to access organizations collection and fetching operations
 */
export function useOrganizations() {
  const {
    organizations,
    isLoading,
    error,
    refreshOrganizations,
    selectedOrganization,
    selectedOrganizationId,
    selectOrganization,
  } = useOrganizationContext();

  return {
    organizations,
    isLoading,
    error,
    refreshOrganizations,
    selectedOrganization,
    selectedOrganizationId,
    selectOrganization,
  };
}

export default useOrganizations;
