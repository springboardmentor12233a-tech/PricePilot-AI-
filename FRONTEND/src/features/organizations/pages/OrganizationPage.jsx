import React, { useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import { Building2, Plus, RefreshCw, AlertCircle, Layers } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import OrganizationDetails from '../components/OrganizationDetails';
import OrganizationStats from '../components/OrganizationStats';
import OrganizationList from '../components/OrganizationList';
import CreateOrganizationModal from '../components/CreateOrganizationModal';
import EmptyState from '../../../components/EmptyState';

export default function OrganizationPage() {
  const {
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    selectOrganization,
    isLoading,
    error,
    refreshOrganizations,
  } = useOrganization();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview'); // 'overview' | 'all'

  // Loading Skeleton
  if (isLoading && organizations.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-white rounded-2xl border border-[#E2E8F0] p-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-[#E2E8F0]" />
          <div className="h-72 bg-white rounded-2xl border border-[#E2E8F0]" />
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (error && organizations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Organization"
          subtitle="Manage your PricePilot AI workspace."
        />
        <div className="bg-white border border-[#FECACA] rounded-2xl p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] mb-1">
            Unable to load your organizations
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] mb-5 leading-relaxed">
            {error}
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={refreshOrganizations}
            leftIcon={RefreshCw}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Zero Organizations Onboarding State
  if (organizations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Organization"
          subtitle="Manage your PricePilot AI workspace."
        />
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight mb-2">
            Create your organization
          </h2>
          <p className="text-sm text-[#64748B] mb-6 leading-relaxed max-w-md mx-auto">
            Create a workspace to start managing products, competitors and pricing intelligence.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={Plus}
            className="shadow-xs"
          >
            Create Organization
          </Button>
        </div>

        <CreateOrganizationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        subtitle="Manage your PricePilot AI workspace."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              leftIcon={RefreshCw}
              onClick={refreshOrganizations}
              className="text-xs h-9.5"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs h-9.5"
            >
              New Organization
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setSelectedTab('overview')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            selectedTab === 'overview'
              ? 'border-[#2563EB] text-[#2563EB] font-semibold'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Active Workspace
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab('all')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            selectedTab === 'all'
              ? 'border-[#2563EB] text-[#2563EB] font-semibold'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <span>All Workspaces</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#F1F5F9] text-[#475569]">
            {organizations.length}
          </span>
        </button>
      </div>

      {selectedTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <OrganizationDetails organization={selectedOrganization} />
          </div>

          <div className="space-y-6">
            <OrganizationStats
              organization={selectedOrganization}
              totalOrganizations={organizations.length}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <OrganizationList
            organizations={organizations}
            selectedOrganizationId={selectedOrganizationId}
            onSelect={selectOrganization}
            onCreateNew={() => setIsCreateModalOpen(true)}
          />
        </div>
      )}

      <CreateOrganizationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
