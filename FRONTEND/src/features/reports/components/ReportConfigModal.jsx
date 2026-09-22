import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  generateExecutivePdfReport,
  downloadSimulationCsv,
  downloadCompetitorCsv,
  triggerBrowserPrint,
} from '../utils/reportExportUtils';
import { useToast } from '../../../hooks/useToast';

export default function ReportConfigModal({
  isOpen,
  onClose,
  reportContext = {},
}) {
  const toast = useToast();

  const [reportType, setReportType] = useState('executive'); // 'executive' | 'competitor' | 'revenue' | 'profitability' | 'simulation' | 'complete'
  const [dateRange, setDateRange] = useState('30d'); // '7d' | '30d' | '90d' | 'ytd'
  const [includeSections, setIncludeSections] = useState({
    summary: true,
    revenue: true,
    profitability: true,
    competitors: true,
    recommendations: true,
    scenarios: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleSection = (key) => {
    setIncludeSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const dateRangeLabel = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    ytd: 'Year to Date',
  }[dateRange] || 'Last 30 Days';

  const reportTitles = {
    executive: 'Executive Business Intelligence Report',
    competitor: 'Competitor Intelligence & Benchmark Report',
    revenue: 'Revenue Optimization & Growth Report',
    profitability: 'Profitability & Margin Realization Report',
    simulation: 'Price–Demand Simulation & Scenario Analysis Report',
    complete: 'Comprehensive Enterprise Pricing & Revenue Intelligence Audit',
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      await generateExecutivePdfReport({
        title: reportTitles[reportType] || 'Executive Business Intelligence Report',
        subtitle: 'Enterprise Pricing, Competitor Dynamics & Elasticity Modeling',
        organizationName: reportContext.organizationName || 'PricePilot Enterprise',
        organizationId: reportContext.organizationId || 'ORG-1001',
        dateRange: dateRangeLabel,
        summaryMetrics: reportContext.summaryMetrics || {},
        products: reportContext.products || [],
        topProducts: reportContext.products || [],
        comparisons: reportContext.comparisons || [],
        recommendations: reportContext.recommendations || [],
        scenarios: reportContext.scenarios || [],
        competitors: reportContext.competitors || [],
        selectedProduct: reportContext.selectedProduct || null,
        includeSections,
      });
      toast.success('Enterprise 13-Page PDF Report generated successfully.');
      onClose();
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Unable to generate PDF directly. Triggering browser print preview fallback.');
      triggerBrowserPrint();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBrowserPrint = () => {
    toast.info('Opening formatted print dialog...');
    triggerBrowserPrint();
  };

  const handleExportCsv = () => {
    try {
      if (reportType === 'competitor' || reportContext.comparisons?.length > 0) {
        downloadCompetitorCsv(reportContext.comparisons || [], reportContext.competitors || []);
        toast.success('Competitor Intelligence CSV exported.');
      } else if (reportContext.scenarios?.length > 0) {
        downloadSimulationCsv(
          reportContext.selectedProduct,
          reportContext.scenarios || [],
          reportContext.currentBaseline
        );
        toast.success('Simulation Scenario CSV exported.');
      } else {
        toast.info('Exporting analytical dataset CSV...');
        downloadCompetitorCsv(reportContext.comparisons || [], []);
      }
      onClose();
    } catch (err) {
      toast.error('CSV export failed.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Business Intelligence Report"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={Printer}
              onClick={handleBrowserPrint}
              title="Print directly or save as PDF using browser dialog"
            >
              Print Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={FileSpreadsheet}
              onClick={handleExportCsv}
              title="Download raw data in CSV spreadsheet format"
            >
              Export CSV
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Download}
              isLoading={isGenerating}
              onClick={handleDownloadPdf}
            >
              Download PDF Report
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-xs text-[#0F172A]">
        {/* Report Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-2 uppercase tracking-wider">
            1. Select Report Scope & Architecture
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              {
                id: 'executive',
                label: 'Executive Summary Briefing',
                desc: 'Top-line revenue, profit margins, and board-ready KPIs',
              },
              {
                id: 'simulation',
                label: 'Price–Demand Simulation Report',
                desc: 'Elasticity curves, scenario models, and margin uplifts',
              },
              {
                id: 'competitor',
                label: 'Competitor Intelligence Matrix',
                desc: 'Price spreads, market indices, and positioning gaps',
              },
              {
                id: 'profitability',
                label: 'Profitability & Margin Realization',
                desc: 'Gross margin trends, COGS attribution, and SKU yield',
              },
              {
                id: 'revenue',
                label: 'Revenue Optimization Ledger',
                desc: 'Realized revenue, AOV trajectory, and category sales',
              },
              {
                id: 'complete',
                label: 'Complete Enterprise Audit',
                desc: 'All analytical modules synthesized into full briefing',
              },
            ].map((opt) => {
              const active = reportType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReportType(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] ring-1 ring-[#2563EB]'
                      : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs block text-[#0F172A]">{opt.label}</span>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />}
                  </div>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block leading-tight">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Range Selection */}
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-2 uppercase tracking-wider">
            2. Reporting Time Period
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
              { id: 'ytd', label: 'Year to Date' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDateRange(d.id)}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
                  dateRange === d.id
                    ? 'border-[#2563EB] bg-[#2563EB] text-white'
                    : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section Inclusions */}
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-2 uppercase tracking-wider">
            3. Include Report Sections
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
            {[
              { key: 'summary', label: 'Executive KPI Summary & High-level Metrics' },
              { key: 'revenue', label: 'Revenue Trend & Category Growth Analysis' },
              { key: 'profitability', label: 'Profit Margins & Cost Breakdown' },
              { key: 'competitors', label: 'Competitor Price Observations & Market Index' },
              { key: 'scenarios', label: 'Price-Demand Simulation Scenarios Table' },
              { key: 'recommendations', label: 'Pending & Applied Pricing Recommendations' },
            ].map((sec) => (
              <label
                key={sec.key}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none text-[11px]"
              >
                <input
                  type="checkbox"
                  checked={includeSections[sec.key]}
                  onChange={() => toggleSection(sec.key)}
                  className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="font-medium text-[#334155]">{sec.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview info banner */}
        <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="text-[11px] text-[#1E40AF]">
            <span className="font-bold">Automated Report Generator:</span> All generated reports
            strictly synthesize verified catalog data, competitor benchmark observations, and
            predictive demand curves directly from your backend endpoints.
          </div>
        </div>
      </div>
    </Modal>
  );
}
