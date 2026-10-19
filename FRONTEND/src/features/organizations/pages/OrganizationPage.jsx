import React, { useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import { Building2, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import OrganizationDetails from '../components/OrganizationDetails';
import OrganizationStats from '../components/OrganizationStats';
import OrganizationList from '../components/OrganizationList';
import CreateOrganizationModal from '../components/CreateOrganizationModal';

const PAGE_TITLE = 'Organization';
const PAGE_DESCRIPTION =
  'Manage your PricePilot AI workspace, members and pricing intelligence settings.';

const CARD =
  'bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

/* ----------------------------- Tabs ----------------------------- */

function TabButton({ id, panelId, active, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={`relative -mb-px flex items-center gap-2 pb-3 pt-1 text-sm cursor-pointer
        transition-colors focus:outline-none focus-visible:text-[#0F172A]
        ${active ? 'font-semibold text-[#0F172A]' : 'font-medium text-[#64748B] hover:text-[#0F172A]'}`}
    >
      {children}
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-[#2563EB] to-[#4F46E5]
          transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`}
      />
    </button>
  );
}

function Tabs({ selected, onChange, count }) {
  const order = ['overview', 'all'];

  // Arrow-key navigation between tabs
  const handleKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = order[(order.indexOf(selected) + (e.key === 'ArrowRight' ? 1 : -1) + order.length) % order.length];
    onChange(next);
    requestAnimationFrame(() => document.getElementById(`org-tab-${next}`)?.focus());
  };

  return (
    <div
      role="tablist"
      aria-label="Organization views"
      onKeyDown={handleKeyDown}
      className="flex gap-7 border-b border-[#E2E8F0]"
    >
      <TabButton
        id="org-tab-overview"
        panelId="org-panel-overview"
        active={selected === 'overview'}
        onClick={() => onChange('overview')}
      >
        Active Workspace
      </TabButton>
      <TabButton
        id="org-tab-all"
        panelId="org-panel-all"
        active={selected === 'all'}
        onClick={() => onChange('all')}
      >
        All Workspaces
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none transition-colors ${
            selected === 'all' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-[#F1F5F9] text-[#475569]'
          }`}
        >
          {count}
        </span>
      </TabButton>
    </div>
  );
}

/* --------------------------- Page states --------------------------- */

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading organizations">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-[#E2E8F0]" />
        <div className="h-9 w-64 rounded-lg bg-[#E2E8F0]" />
        <div className="h-4 w-96 max-w-full rounded-full bg-[#EEF2F6]" />
      </div>
      <div className="h-8 w-72 rounded-lg bg-[#EEF2F6]" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={`${CARD} h-72 lg:col-span-2`} />
        <div className={`${CARD} h-72`} />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace" title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
      <div
        role="alert"
        className="mx-auto max-w-lg rounded-2xl border border-[#FECACA] bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#DC2626] ring-1 ring-[#FECACA]">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-[#0F172A]">
          Unable to load your organizations
        </h3>
        <p className="mb-5 text-sm leading-relaxed text-[#64748B]">{message}</p>
        <Button variant="primary" size="md" onClick={onRetry} leftIcon={RefreshCw}>
          Try again
        </Button>
      </div>
    </div>
  );
}

function OnboardingState({ onCreate }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace" title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
      <div className={`${CARD} relative mx-auto max-w-xl overflow-hidden p-8 text-center sm:p-12`}>
        {/* Soft decorative glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#DBEAFE] to-transparent opacity-70 blur-2xl"
        />
        <div className="relative">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#E0E7FF] text-[#2563EB] ring-1 ring-[#BFDBFE]">
            <Building2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-[#0F172A]">
            Create your organization
          </h2>
          <p className="mx-auto mb-7 max-w-md text-sm leading-relaxed text-[#64748B]">
            Create a workspace to start managing products, competitors and pricing intelligence in
            one place.
          </p>
          <Button variant="primary" size="lg" onClick={onCreate} leftIcon={Plus}>
            Create Organization
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Page ------------------------------ */

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

  const openCreate = () => setIsCreateModalOpen(true);
  const closeCreate = () => setIsCreateModalOpen(false);

  const createModal = <CreateOrganizationModal isOpen={isCreateModalOpen} onClose={closeCreate} />;

  if (isLoading && organizations.length === 0) return <LoadingSkeleton />;

  if (error && organizations.length === 0) {
    return <ErrorState message={error} onRetry={refreshOrganizations} />;
  }

  if (organizations.length === 0) {
    return (
      <>
        <OnboardingState onCreate={openCreate} />
        {createModal}
      </>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        divider={false}
        className="!mb-0"
        badge={
          selectedOrganization?.name ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#334155] ring-1 ring-inset ring-[#E2E8F0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
              {selectedOrganization.name}
            </span>
          ) : null
        }
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              leftIcon={RefreshCw}
              onClick={refreshOrganizations}
              disabled={isLoading}
              className="h-10 text-xs"
            >
              {isLoading ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={openCreate}
              className="h-10 text-xs"
            >
              New Organization
            </Button>
          </>
        }
      />

      {/* Non-blocking error: data is shown, but the latest refresh failed */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="flex-1 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={refreshOrganizations}
            className="shrink-0 cursor-pointer text-xs font-semibold underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="space-y-6">
        <Tabs selected={selectedTab} onChange={setSelectedTab} count={organizations.length} />

        {selectedTab === 'overview' ? (
          <div
            role="tabpanel"
            id="org-panel-overview"
            aria-labelledby="org-tab-overview"
            className="grid grid-cols-1 gap-6 lg:grid-cols-3"
          >
            <div className="space-y-6 lg:col-span-2">
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
          <div
            role="tabpanel"
            id="org-panel-all"
            aria-labelledby="org-tab-all"
            className="space-y-4"
          >
            <OrganizationList
              organizations={organizations}
              selectedOrganizationId={selectedOrganizationId}
              onSelect={selectOrganization}
              onCreateNew={openCreate}
            />
          </div>
        )}
      </div>

      {createModal}
    </div>
  );
}