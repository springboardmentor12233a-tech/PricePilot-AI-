import React from 'react';
import { RefreshCw, Clock, Building2 } from 'lucide-react';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';
import { useOrganization } from '../../organizations/hooks/useOrganization';

export default function ExecutiveHeader({
  lastUpdated,
  onRefresh,
  isRefreshing,
}) {
  const { selectedOrganization } = useOrganization();

  // Format real timestamp if available
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Executive Dashboard
          </h1>
          {selectedOrganization?.name && (
            <Badge variant="neutral" className="hidden sm:inline-flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#64748B]" />
              <span className="truncate max-w-[150px]">{selectedOrganization.name}</span>
            </Badge>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed">
          Monitor pricing, demand, revenue, and competitive intelligence across your organization.
        </p>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-center">
        {formattedTime && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#94A3B8]">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {formattedTime}</span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          leftIcon={RefreshCw}
          className={isRefreshing ? '[&_svg]:animate-spin' : ''}
          aria-label="Refresh executive dashboard data"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
    </div>
  );
}
