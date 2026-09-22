import React, { useState, useMemo } from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  IndianRupee,
  PieChart,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { useProducts } from '../../products/hooks/useProducts';
import { useCompetitors } from '../../competitors/hooks/useCompetitors';
import { formatINR, formatINRCompact } from '../../../utils/formatCurrency';
import ReportConfigModal from '../components/ReportConfigModal';
import { triggerBrowserPrint, generateEnterprise13PagePdf } from '../utils/reportExportUtils';
import { useToast } from '../../../hooks/useToast';

export default function ExecutiveReportPage() {
  const toast = useToast();
  const { selectedOrganization, selectedOrganizationId } = useOrganization();
  const { products } = useProducts(selectedOrganizationId);
  const { competitors } = useCompetitors(selectedOrganizationId);

  const [dateRange, setDateRange] = useState('30d');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDownloadingFullPdf, setIsDownloadingFullPdf] = useState(false);

  // Synthesized Executive Revenue & Growth Trends (India Rupees)
  const executiveTrendData = useMemo(() => {
    return [
      { period: 'Jan', revenue: 19500000, profit: 8200000, margin: 42.0 },
      { period: 'Feb', revenue: 21000000, profit: 9100000, margin: 43.3 },
      { period: 'Mar', revenue: 22800000, profit: 9950000, margin: 43.6 },
      { period: 'Apr', revenue: 24200000, profit: 10400000, margin: 43.0 },
      { period: 'May', revenue: 26500000, profit: 11600000, margin: 43.8 },
      { period: 'Jun', revenue: 28450000, profit: 11820000, margin: 41.5 },
    ];
  }, []);

  const executiveMetrics = useMemo(() => {
    const totalRev = 28450000;
    const grossProf = 11820000;
    const avgMargin = 41.5;
    const elasticityIndex = -1.42;
    const oppIdentified = 3840000;

    return {
      totalRev,
      grossProf,
      avgMargin,
      elasticityIndex,
      oppIdentified,
      marketPosition: 'Price Competitive Leader',
      pricingIndexVsMarket: '104.2% (Premium Quality Tier)',
      activeAlertsCount: 3,
      recommendationsApplied: 18,
      realizedLiftPct: 8.6,
      marginImprovementBps: 240,
    };
  }, []);

  const handleQuickDownload13PageReport = async () => {
    setIsDownloadingFullPdf(true);
    try {
      await generateEnterprise13PagePdf({
        organizationName: selectedOrganization?.name || 'PricePilot Enterprise',
        organizationId: selectedOrganizationId || 'ORG-1001',
        dateRange: 'Trailing 30 Days (Q3 2026)',
        summaryMetrics: {
          totalRevenue: executiveMetrics.totalRev,
          averageMargin: executiveMetrics.avgMargin,
          averagePrice: 4250,
          potentialUplift: executiveMetrics.oppIdentified,
          competitorPriceIndex: 98.4,
        },
        products,
        competitors,
      });
      toast.success('Enterprise 13-Page PDF Report downloaded.');
    } catch (err) {
      console.error(err);
      toast.error('Could not generate PDF directly. Triggering browser print preview.');
      triggerBrowserPrint();
    } finally {
      setIsDownloadingFullPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Business Intelligence Briefing"
        description="Consolidated board-level synthesis of dynamic pricing yield, gross margin expansion, and market positioning."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={Printer}
              onClick={triggerBrowserPrint}
            >
              Print Briefing
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              isLoading={isDownloadingFullPdf}
              onClick={handleQuickDownload13PageReport}
              title="Download full 13-page executive business report PDF"
            >
              Download 13-Page PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={FileText}
              onClick={() => setIsReportModalOpen(true)}
            >
              Configure Custom PDF
            </Button>
          </div>
        }
      />

      {/* 1. Primary Executive KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Total Revenue (MRR)</span>
          <div className="text-xl font-bold font-mono text-[#0F172A] mt-1">
            {formatINRCompact(executiveMetrics.totalRev)}
          </div>
          <span className="text-[11px] text-[#16A34A] font-semibold flex items-center mt-1">
            <ArrowUpRight className="w-3 h-3" />+14.2% YoY
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Gross Profit</span>
          <div className="text-xl font-bold font-mono text-[#16A34A] mt-1">
            {formatINRCompact(executiveMetrics.grossProf)}
          </div>
          <span className="text-[11px] text-[#64748B] block mt-1">
            41.5% Gross Margin
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Average Margin %</span>
          <div className="text-xl font-bold font-mono text-[#2563EB] mt-1">
            {executiveMetrics.avgMargin}%
          </div>
          <span className="text-[11px] text-[#16A34A] font-semibold flex items-center mt-1">
            <ArrowUpRight className="w-3 h-3" />+240 bps expansion
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Price Elasticity Index</span>
          <div className="text-xl font-bold font-mono text-[#7C3AED] mt-1">
            {executiveMetrics.elasticityIndex}
          </div>
          <span className="text-[11px] text-[#64748B] block mt-1">
            Moderately Elastic
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs col-span-2 md:col-span-1">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Revenue Opportunity</span>
          <div className="text-xl font-bold font-mono text-[#059669] mt-1">
            {formatINRCompact(executiveMetrics.oppIdentified)}
          </div>
          <span className="text-[11px] text-[#059669] font-semibold block mt-1">
            Identified by AI
          </span>
        </div>
      </div>

      {/* 2. Executive Narrative Briefing Box */}
      <div className="bg-gradient-to-r from-[#EFF6FF] to-[#F0FDF4] border border-[#BFDBFE] rounded-2xl p-5 shadow-xs flex items-start gap-4">
        <Sparkles className="w-6 h-6 text-[#2563EB] shrink-0 mt-0.5" />
        <div className="space-y-1.5 text-xs text-[#1E3A8A]">
          <h3 className="font-bold text-sm text-[#1E40AF]">
            Executive Briefing Summary • {selectedOrganization?.name || 'Enterprise'}
          </h3>
          <p className="leading-relaxed text-[#1E3A8A]">
            PricePilot models report strong pricing power across high-velocity categories. 
            Implementation of dynamic pricing recommendations has driven an estimated 
            <strong> +8.6% annualized top-line uplift</strong> with <strong>240 basis points</strong> of gross 
            margin expansion over the trailing 6 months. Market parity benchmark indicates catalog prices 
            remain securely within the competitive sweet spot (4.2% quality premium), sustaining customer conversion.
          </p>
        </div>
      </div>

      {/* 3. Trend Visualizer (Revenue & Gross Profit Trajectory) */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">
              Gross Revenue & Profit Contribution Momentum
            </h3>
            <p className="text-xs text-[#64748B]">
              Realized monthly performance trajectory across active catalog categories in Indian Rupees (₹).
            </p>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={executiveTrendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tickFormatter={(v) => formatINRCompact(v)} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                formatter={(val, name) => [formatINR(val), name === 'revenue' ? 'Gross Revenue' : 'Gross Profit']}
                contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 11 }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Gross Revenue"
                stroke="#2563EB"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Gross Profit"
                stroke="#16A34A"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorProf)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Competitor Benchmark & Optimization Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Competitor Benchmark Summary */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Competitor Benchmark Posture</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Market Stance</span>
                <span className="font-bold text-sm text-[#0F172A]">{executiveMetrics.marketPosition}</span>
              </div>
              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#EFF6FF] text-[#1D4ED8]">
                Balanced Tier
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Pricing Index vs. Market</span>
                <span className="font-bold text-sm text-[#0F172A]">{executiveMetrics.pricingIndexVsMarket}</span>
              </div>
              <span className="text-[11px] text-[#64748B]">Indexed to 100.0</span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Active Disruption Alerts</span>
                <span className="font-bold text-sm text-[#DC2626]">{executiveMetrics.activeAlertsCount} Competitor Shifts</span>
              </div>
              <span className="text-[11px] text-[#DC2626] font-semibold">Under-pricing flagged</span>
            </div>
          </div>
        </div>

        {/* Pricing Optimization Performance */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#16A34A]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Pricing Optimization Adherence</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Recommendations Applied</span>
                <span className="font-bold text-sm text-[#16A34A]">{executiveMetrics.recommendationsApplied} Decisive Adjustments</span>
              </div>
              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                92% Acceptance
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Annualized Revenue Lift</span>
                <span className="font-bold text-sm text-[#0F172A]">+{executiveMetrics.realizedLiftPct}% Verified</span>
              </div>
              <span className="text-[11px] text-[#16A34A] font-semibold">+₹24.40 Lakh GMV</span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Net Margin Expansion</span>
                <span className="font-bold text-sm text-[#0F172A]">+{executiveMetrics.marginImprovementBps} Basis Points</span>
              </div>
              <span className="text-[11px] text-[#64748B]">COGS-adjusted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Configuration Modal */}
      <ReportConfigModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportContext={{
          organizationName: selectedOrganization?.name,
          products,
          summaryMetrics: {
            totalRevenue: executiveMetrics.totalRev,
            totalProfit: executiveMetrics.grossProf,
            pricingLift: executiveMetrics.realizedLiftPct,
            pricingOpportunitiesCount: 12,
          },
        }}
      />
    </div>
  );
}
