import React from 'react';
import { Building2, Plus } from 'lucide-react';
import OrganizationCard from './OrganizationCard';
import Button from '../../../components/Button';
import EmptyState from '../../../components/EmptyState';

export default function OrganizationList({
  organizations = [],
  selectedOrganizationId,
  onSelect,
  onViewDetails,
  onCreateNew,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[1, 2].map((n) => (
          <div
            key={n}
            className="bg-white border border-[#E2E8F0] rounded-2xl p-6 h-44 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-1/2 h-5 bg-[#F1F5F9] rounded-md" />
              <div className="w-1/3 h-3 bg-[#F1F5F9] rounded-md" />
              <div className="w-3/4 h-3 bg-[#F1F5F9] rounded-md" />
            </div>
            <div className="w-1/4 h-4 bg-[#F1F5F9] rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No organizations found"
        description="You have not created or joined any organization workspaces yet. Create one to begin managing your pricing intelligence."
        actionText="Create Organization"
        onAction={onCreateNew}
        actionIcon={Plus}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {organizations.map((org) => (
          <OrganizationCard
            key={org.id}
            organization={org}
            isSelected={String(org.id) === String(selectedOrganizationId)}
            onSelect={onSelect}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}
