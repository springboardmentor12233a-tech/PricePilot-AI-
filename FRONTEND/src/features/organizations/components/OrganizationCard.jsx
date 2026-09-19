import React from 'react';
import { Building2, Check, ExternalLink, Calendar, Hash } from 'lucide-react';
import Badge from '../../../components/Badge';
import Button from '../../../components/Button';
import { formatOrgDate, getOrgStatus } from '../utils/organizationHelpers';

/**
 * Reusable OrganizationCard Component
 * Displays backend-supported attributes: name, slug, description, status, created_at
 */
export default function OrganizationCard({
  organization,
  isSelected = false,
  onSelect,
  onViewDetails,
  className = '',
}) {
  if (!organization) return null;

  const status = getOrgStatus(organization);
  const createdDate = formatOrgDate(organization.created_at);

  return (
    <div
      className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all duration-200 ${
        isSelected
          ? 'border-[#2563EB] ring-1 ring-[#2563EB] shadow-xs'
          : 'border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-xs'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isSelected
                ? 'bg-[#EFF6FF] text-[#2563EB]'
                : 'bg-[#F1F5F9] text-[#475569]'
            }`}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[#0F172A] tracking-tight">
                {organization.name}
              </h3>
              {isSelected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
            {organization.slug && (
              <p className="text-xs font-mono text-[#64748B] mt-0.5 flex items-center gap-1">
                <Hash className="w-3 h-3 text-[#94A3B8]" />
                {organization.slug}
              </p>
            )}
          </div>
        </div>

        <Badge variant={status.variant} size="sm">
          {status.label}
        </Badge>
      </div>

      {organization.description ? (
        <p className="text-xs sm:text-sm text-[#64748B] line-clamp-2 mb-4 leading-relaxed">
          {organization.description}
        </p>
      ) : (
        <p className="text-xs text-[#94A3B8] italic mb-4">No description provided.</p>
      )}

      <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
        <div className="flex items-center gap-1.5 text-[#94A3B8]">
          <Calendar className="w-3.5 h-3.5" />
          <span>Created {createdDate}</span>
        </div>

        <div className="flex items-center gap-2">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(organization)}
              className="text-xs h-8"
            >
              Details
            </Button>
          )}

          {onSelect && !isSelected && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSelect(organization.id)}
              className="text-xs h-8"
            >
              Select Workspace
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
