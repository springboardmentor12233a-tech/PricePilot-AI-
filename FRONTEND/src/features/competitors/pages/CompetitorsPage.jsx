import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CompetitorHeader from '../components/CompetitorHeader';
import CompetitorSearch from '../components/CompetitorSearch';
import CompetitorFilters from '../components/CompetitorFilters';
import CompetitorTable from '../components/CompetitorTable';
import CompetitorCard from '../components/CompetitorCard';
import CompetitorForm from '../components/CompetitorForm';
import CompetitorProductMatch from '../components/CompetitorProductMatch';
import EmptyState from '../../../components/EmptyState';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorState from '../../../components/ErrorState';
import { useCompetitors } from '../hooks/useCompetitors';
import { useCompetitorMutations } from '../hooks/useCompetitorMutations';
import { useProducts } from '../../products/hooks/useProducts';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { filterCompetitors } from '../utils/competitorHelpers';
import { useToast } from '../../../hooks/useToast';
import { Users2, Plus, LayoutGrid, List } from 'lucide-react';

export default function CompetitorsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedOrganizationId } = useOrganization();

  const {
    competitors,
    isLoading,
    error,
    refresh,
    setCompetitors,
  } = useCompetitors(selectedOrganizationId);

  const {
    createCompetitor,
    updateCompetitor,
    matchProduct,
    isMutating,
  } = useCompetitorMutations();

  const { products } = useProducts(selectedOrganizationId);

  // Local state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState(null);
  const [isMatchOpen, setIsMatchOpen] = useState(false);

  // Filtered list
  const filteredCompetitors = useMemo(() => {
    return filterCompetitors(competitors, { search, status });
  }, [competitors, search, status]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingCompetitor(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (comp) => {
    setEditingCompetitor(comp);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (editingCompetitor) {
        const updated = await updateCompetitor(editingCompetitor.id, payload);
        toast.success('Competitor updated successfully.');
        setCompetitors((prev) =>
          prev.map((c) => (c.id === editingCompetitor.id ? { ...c, ...updated } : c))
        );
      } else {
        const created = await createCompetitor(payload);
        toast.success('Competitor added successfully.');
        setCompetitors((prev) => [created, ...prev]);
      }
      setIsFormOpen(false);
      refresh();
    } catch (err) {
      toast.error(err.message || 'Unable to save competitor.');
    }
  };

  const handleMatchSubmit = async (payload) => {
    await matchProduct(payload);
  };

  const handleViewDetails = (competitorId) => {
    navigate(`/competitors/${competitorId}`);
  };

  return (
    <div className="space-y-6">
      <CompetitorHeader
        onAddCompetitor={handleOpenAdd}
        onMatchProduct={() => setIsMatchOpen(true)}
        onRefresh={refresh}
        isLoading={isLoading}
        totalCount={competitors.length}
      />

      {/* Loading State */}
      {isLoading && competitors.length === 0 ? (
        <div className="py-20 text-center">
          <LoadingSpinner size="lg" text="Loading competitors..." />
        </div>
      ) : error ? (
        <ErrorState
          title="Error Loading Competitors"
          message={error}
          onRetry={refresh}
        />
      ) : competitors.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No Competitors Tracked Yet"
          description="Register competitor domains or merchant listings to monitor market pricing movements and gaps."
          actionText="Add Competitor"
          onAction={handleOpenAdd}
          actionIcon={Plus}
        />
      ) : (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
              <CompetitorSearch value={search} onChange={setSearch} />
              <CompetitorFilters status={status} onStatusChange={setStatus} />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#2563EB] shadow-2xs' : 'text-[#64748B]'
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-[#2563EB] shadow-2xs' : 'text-[#64748B]'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Competitor Items */}
          {filteredCompetitors.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E8F0] p-12 text-center bg-white">
              <Users2 className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">No competitors match your criteria</p>
              <p className="text-xs text-[#64748B] mt-1">
                Try adjusting your search query or status filter.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <CompetitorTable
              competitors={filteredCompetitors}
              onView={handleViewDetails}
              onEdit={handleOpenEdit}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompetitors.map((comp) => (
                <CompetitorCard
                  key={comp.id}
                  competitor={comp}
                  onView={handleViewDetails}
                  onEdit={handleOpenEdit}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <CompetitorForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingCompetitor}
        isLoading={isMutating}
      />

      {/* Match Product Modal */}
      <CompetitorProductMatch
        isOpen={isMatchOpen}
        onClose={() => setIsMatchOpen(false)}
        onSubmit={handleMatchSubmit}
        products={products}
        competitors={competitors}
        isLoading={isMutating}
      />
    </div>
  );
}
