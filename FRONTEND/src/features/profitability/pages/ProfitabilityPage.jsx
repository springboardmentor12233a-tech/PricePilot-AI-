import React from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import EmptyState from '../../../components/EmptyState';
import { PieChart, Download } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export default function ProfitabilityPage() {
  const toast = useToast();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profitability Intelligence"
        description="Net margin analysis, cost-of-goods-sold attribution, and SKU-level contribution profit."
        actions={
          <Button
            variant="outline"
            size="md"
            leftIcon={Download}
            onClick={() => toast.info('Export margin breakdown report')}
          >
            Export Margins
          </Button>
        }
      />

      <EmptyState
        icon={PieChart}
        title="No Profitability Data Recorded"
        description="Configure product unit costs and sales transactions to compute real-time gross margin and net profitability."
        actionText="Configure Base Costs"
        onAction={() => toast.info('Configure product base costs in products catalog')}
      />
    </div>
  );
}
