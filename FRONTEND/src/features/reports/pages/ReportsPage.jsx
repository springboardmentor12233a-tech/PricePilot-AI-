import React, { useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  ArrowDownToLine,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { useProducts } from '../../products/hooks/useProducts';
import ReportConfigModal from '../components/ReportConfigModal';
import { triggerBrowserPrint } from '../utils/reportExportUtils';
import { useToast } from '../../../hooks/useToast';

export default function ReportsPage() {
  const toast = useToast();
  const { selectedOrganization, selectedOrganizationId } = useOrganization();
  const { products } = useProducts(selectedOrganizationId);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Pre-configured report artifacts
  const availableReports = [
    {
      id: 'rep-exec',
      title: 'Executive Business Intelligence Briefing',
      category: 'Board & Leadership',
      description: 'Synthesizes top-line revenue lift, gross margin expansion (+240 bps), and pricing agility score.',
      frequency: 'Monthly / On-Demand',
      format: 'PDF / Print',
      lastGenerated: 'Today, 09:30 AM',
    },
    {
      id: 'rep-sim',
      title: 'Price–Demand Simulation & Elasticity Scenario Audit',
      category: 'Pricing Strategy',
      description: 'Model-simulated demand response continuum, optimal revenue/profit prices, and SKU scenario matrix.',
      frequency: 'Live Interactive',
      format: 'PDF / CSV',
      lastGenerated: 'Yesterday',
    },
    {
      id: 'rep-comp',
      title: 'Competitor Price Index & Disruption Benchmark',
      category: 'Market Intelligence',
      description: 'Market spread analysis, competitor undercutting alerts, and cross-catalog positioning gaps.',
      frequency: 'Weekly',
      format: 'PDF / CSV',
      lastGenerated: '2 days ago',
    },
    {
      id: 'rep-profit',
      title: 'Profitability Realization & COGS Margin Breakdown',
      category: 'Financial Analytics',
      description: 'SKU-level contribution profits, margin compression warnings, and inventory cost attribution.',
      frequency: 'Monthly',
      format: 'PDF / CSV',
      lastGenerated: '3 days ago',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing & Revenue Intelligence Reports"
        description="Enterprise business reports, elasticity scenario models, and competitor variance audits."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={Printer}
              onClick={triggerBrowserPrint}
            >
              Print Report
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Download}
              onClick={() => setIsReportModalOpen(true)}
            >
              Generate Custom Report
            </Button>
          </div>
        }
      />

      {/* Hero Banner */}
      <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Enterprise Intelligence Report Suite</h3>
            <p className="text-xs text-[#64748B]">
              Automated multi-page PDF generation and raw CSV datasets compiled directly from model inference.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={Sparkles}
          onClick={() => setIsReportModalOpen(true)}
        >
          Open Report Builder
        </Button>
      </div>

      {/* Available Report Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableReports.map((rep) => (
          <div
            key={rep.id}
            className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#BFDBFE] transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1D4ED8]">
                  {rep.category}
                </span>
                <span className="text-[10px] font-mono text-[#94A3B8]">
                  Format: {rep.format}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#0F172A]">{rep.title}</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">{rep.description}</p>
            </div>

            <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
              <span className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                <Clock className="w-3 h-3" /> Last: {rep.lastGenerated}
              </span>
              <Button
                variant="outline"
                size="sm"
                leftIcon={ArrowDownToLine}
                onClick={() => setIsReportModalOpen(true)}
              >
                Configure & Export
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Configuration Modal */}
      <ReportConfigModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportContext={{
          organizationName: selectedOrganization?.name,
          products,
        }}
      />
    </div>
  );
}
