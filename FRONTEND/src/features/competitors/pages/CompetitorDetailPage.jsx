import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import CompetitorStatusBadge from '../components/CompetitorStatusBadge';
import CompetitorForm from '../components/CompetitorForm';
import CompetitorPriceForm from '../components/CompetitorPriceForm';
import PriceHistoryTable from '../components/PriceHistoryTable';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useCompetitor } from '../hooks/useCompetitor';
import { useCompetitorMutations } from '../hooks/useCompetitorMutations';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { useProducts } from '../../products/hooks/useProducts';
import { useToast } from '../../../hooks/useToast';
import {
  ArrowLeft,
  Building2,
  Globe,
  Calendar,
  Edit3,
  PlusCircle,
  AlertCircle,
  Tag,
} from 'lucide-react';

export default function CompetitorDetailPage() {
  const { competitorId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedOrganizationId } = useOrganization();

  const {
    competitor,
    isLoading,
    isNotFound,
    refresh,
  } = useCompetitor(competitorId);

  const { products } = useProducts(selectedOrganizationId);

  const {
    updateCompetitor,
    recordCompetitorPrice,
    isMutating,
  } = useCompetitorMutations();

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRecordPriceOpen, setIsRecordPriceOpen] = useState(false);

  const handleUpdate = async (payload) => {
    try {
      await updateCompetitor(competitor.id, payload);
      toast.success('Competitor updated successfully.');
      setIsEditOpen(false);
      refresh();
    } catch (err) {
      toast.error(err.message || 'Unable to update competitor.');
    }
  };

  const handleRecordPrice = async (payload) => {
    await recordCompetitorPrice(payload);
    refresh();
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <LoadingSpinner size="lg" text="Loading competitor profile..." />
      </div>
    );
  }

  if (isNotFound || !competitor) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#64748B] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">
            Competitor information is unavailable.
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            This competitor may have been removed or belongs to another workspace organization.
          </p>
        </div>
        <Button
          variant="outline"
          size="md"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/competitors')}
        >
          Back to Competitors
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/competitors')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Competitors</span>
        </button>
      </div>

      {/* Header */}
      <PageHeader
        title={competitor.name}
        description={`Competitor ID: ${competitor.id} • Monitored competitor entity in active workspace.`}
        badge={<CompetitorStatusBadge isActive={competitor.is_active} />}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              leftIcon={Edit3}
              onClick={() => setIsEditOpen(true)}
            >
              Edit Competitor
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={PlusCircle}
              onClick={() => setIsRecordPriceOpen(true)}
            >
              Record Price
            </Button>
          </div>
        }
      />

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Competitor Profile" subtitle="General identity and tracking configuration">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A]">
                    {competitor.name}
                  </h3>
                  {competitor.website ? (
                    <a
                      href={competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] hover:underline mt-0.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{competitor.website}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-[#94A3B8]">No website specified</span>
                  )}
                </div>
              </div>

              {competitor.description && (
                <div className="pt-3 border-t border-[#F1F5F9]">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                    Description & Notes
                  </span>
                  <p className="text-xs text-[#0F172A] leading-relaxed">
                    {competitor.description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Price Observations */}
          <Card
            title="Price Observation Records"
            subtitle="Catalog prices documented for this competitor"
            headerAction={
              <Button
                variant="outline"
                size="sm"
                leftIcon={PlusCircle}
                onClick={() => setIsRecordPriceOpen(true)}
              >
                Add Observation
              </Button>
            }
          >
            <PriceHistoryTable
              observations={competitor.price_observations || []}
            />
          </Card>
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-6">
          <Card title="System Metadata" subtitle="Organization & auditing timestamps">
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Entity ID</span>
                <span className="font-mono text-[#0F172A]">{competitor.id}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Organization ID</span>
                <span className="font-mono text-[#0F172A]">
                  {competitor.organization_id || selectedOrganizationId || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Monitoring Status</span>
                <CompetitorStatusBadge isActive={competitor.is_active} size="xs" />
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Created Date</span>
                <span className="text-[#0F172A]">
                  {competitor.created_at ? new Date(competitor.created_at).toLocaleDateString() : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Last Updated</span>
                <span className="text-[#0F172A]">
                  {competitor.updated_at ? new Date(competitor.updated_at).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <CompetitorForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        initialData={competitor}
        isLoading={isMutating}
      />

      {/* Record Price Modal */}
      <CompetitorPriceForm
        isOpen={isRecordPriceOpen}
        onClose={() => setIsRecordPriceOpen(false)}
        onSubmit={handleRecordPrice}
        products={products}
        competitors={[competitor]}
        initialCompetitorId={String(competitor.id)}
        isLoading={isMutating}
      />
    </div>
  );
}
