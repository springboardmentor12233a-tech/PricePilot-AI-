import React from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import EmptyState from '../../../components/EmptyState';
import { DollarSign, Download } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export default function RevenuePage() {
  const toast = useToast();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue Analytics"
        description="Comprehensive analysis of realized gross revenue, pricing contribution margins, and ASP trends."
        actions={
          <Button
            variant="outline"
            size="md"
            leftIcon={Download}
            onClick={() => toast.info('Export revenue summary report.')}
          >
            Export Ledger
          </Button>
        }
      />

      <EmptyState
        icon={DollarSign}
        title="No Revenue Analytics Found"
        description="Connect your sales channel or push transaction events to GET /api/v1/sales/analytics/{organization_id} to view breakdowns."
        actionText="Connect Sales Stream"
        onAction={() => toast.info('Sales ingestion endpoint ready for FastAPI.')}
      />
    </div>
  );
}
