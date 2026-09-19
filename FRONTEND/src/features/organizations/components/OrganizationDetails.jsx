import React from 'react';
import Card from '../../../components/Card';
import Badge from '../../../components/Badge';
import { Building2, Calendar, Hash, CheckCircle2, Clock, Globe } from 'lucide-react';
import { formatOrgDate, getOrgStatus } from '../utils/organizationHelpers';

export default function OrganizationDetails({ organization }) {
  if (!organization) {
    return (
      <Card>
        <p className="text-xs text-[#94A3B8] italic">No active organization selected.</p>
      </Card>
    );
  }

  const status = getOrgStatus(organization);
  const createdDate = formatOrgDate(organization.created_at);
  const updatedDate = formatOrgDate(organization.updated_at);

  return (
    <Card
      title="Workspace Profile"
      subtitle="Details for the active multi-tenant workspace"
    >
      <div className="space-y-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">
                {organization.name}
              </h3>
              {organization.slug && (
                <p className="text-xs font-mono text-[#64748B] mt-0.5 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-[#94A3B8]" />
                  {organization.slug}
                </p>
              )}
            </div>
          </div>

          <Badge variant={status.variant} size="md" dot>
            {status.label}
          </Badge>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-2">
            Description
          </label>
          <p className="text-sm text-[#475569] leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
            {organization.description || (
              <span className="text-[#94A3B8] italic">No description provided for this workspace.</span>
            )}
          </p>
        </div>

        {/* Backend Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] mb-1">
              <Hash className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>Workspace ID</span>
            </div>
            <p className="font-mono text-xs font-semibold text-[#0F172A] truncate">
              {organization.id}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>Created Date</span>
            </div>
            <p className="text-xs font-semibold text-[#0F172A]">
              {createdDate}
            </p>
          </div>

          {organization.updated_at && (
            <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white">
              <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] mb-1">
                <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>Last Updated</span>
              </div>
              <p className="text-xs font-semibold text-[#0F172A]">
                {updatedDate}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
