import React from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import { Plus, RefreshCw, Link2 } from 'lucide-react';

export default function CompetitorHeader({
  onAddCompetitor,
  onMatchProduct,
  onRefresh,
  isLoading = false,
  totalCount = 0,
}) {
  return (
    <PageHeader
      title="Competitors"
      description="Monitor competitor activity and understand your market position."
      badge={
        totalCount > 0 ? (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100">
            {totalCount} {totalCount === 1 ? 'Competitor' : 'Competitors'}
          </span>
        ) : null
      }
      actions={
        <div className="flex items-center gap-2.5">
          {onRefresh && (
            <Button
              variant="outline"
              size="md"
              leftIcon={RefreshCw}
              onClick={onRefresh}
              disabled={isLoading}
              className={isLoading ? 'animate-spin' : ''}
              title="Refresh competitors"
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}

          {onMatchProduct && (
            <Button
              variant="outline"
              size="md"
              leftIcon={Link2}
              onClick={onMatchProduct}
            >
              Match Product
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={onAddCompetitor}
          >
            Add Competitor
          </Button>
        </div>
      }
    />
  );
}
