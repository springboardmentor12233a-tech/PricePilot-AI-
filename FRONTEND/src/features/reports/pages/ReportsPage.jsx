import React from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import EmptyState from '../../../components/EmptyState';
import { FileSpreadsheet, Download } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export default function ReportsPage() {
  const toast = useToast();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing & Market Reports"
        description="Detailed analytical exports covering price alterations, competitor movements, and category elasticity."
        actions={
          <Button
            variant="outline"
            size="md"
            leftIcon={Download}
            onClick={() => toast.info('Exporting quarterly report...')}
          >
            Export All (CSV)
          </Button>
        }
      />

      <EmptyState
        icon={FileSpreadsheet}
        title="No Generated Reports"
        description="Automated pricing audit and competitor variance reports will be available once catalog changes occur."
        actionText="Generate Audit Report"
        onAction={() => toast.info('Audit generation scheduled for next prompt.')}
        actionIcon={FileSpreadsheet}
      />
    </div>
  );
}
