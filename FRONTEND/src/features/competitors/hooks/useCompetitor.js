import { useMemo } from 'react';
import { useCompetitors } from './useCompetitors';
import { useOrganization } from '../../organizations/hooks/useOrganization';

/**
 * Hook to derive a selected competitor from loaded organization competitors
 * Strictly avoids calling undocumented GET /competitors/{id}
 */
export function useCompetitor(competitorId) {
  const { selectedOrganizationId } = useOrganization();
  const { competitors, isLoading, error, refresh } = useCompetitors(selectedOrganizationId);

  const competitor = useMemo(() => {
    if (!competitorId || !competitors || competitors.length === 0) return null;
    return competitors.find((c) => String(c.id) === String(competitorId)) || null;
  }, [competitorId, competitors]);

  return {
    competitor,
    isLoading,
    error,
    refresh,
    isNotFound: !isLoading && !competitor && competitors.length > 0,
  };
}

export default useCompetitor;
