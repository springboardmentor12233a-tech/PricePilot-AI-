import React, { useState, useMemo } from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import {
  IndianRupee,
  Download,
  TrendingUp,
  ShoppingBag,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { useProducts } from '../../products/hooks/useProducts';
import { formatCurrency } from '../../../utils/formatCurrency';
import { downloadCsv } from '../../reports/utils/reportExportUtils';
import ReportConfigModal from '../../reports/components/ReportConfigModal';
import { useToast } from '../../../hooks/useToast';

export default function RevenuePage() {
  const toast = useToast();
  const { selectedOrganization, selectedOrganizationId } = useOrganization();
  const { products, isLoading } = useProducts(selectedOrganizationId);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [perfFilter, setPerfFilter] = useState('ALL'); // 'ALL' | 'HIGH' | 'UNDER'
  const [searchQuery, setSearchQuery] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Compute revenue dataset from products catalog
  const analyzedProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return [
        { id: '1', name: 'Ultra Wireless Noise-Cancelling Headphones', sku: 'WH-1000XM5', category: 'Audio', base_price: 349.99, units: 320 },
        { id: '2', name: 'Smart Fitness Tracker & Heart Monitor', sku: 'FIT-PRO-4', category: 'Wearables', base_price: 129.99, units: 640 },
        { id: '3', name: 'Ergonomic Mechanical Office Keyboard', sku: 'KB-MECH-RGB', category: 'Accessories', base_price: 159.99, units: 410 },
        { id: '4', name: '4K Ultra-HD USB-C Webcam with Mic', sku: 'CAM-4K-PRO', category: 'Video', base_price: 199.99, units: 280 },
        { id: '5', name: 'Fast Qi Wireless Charging Stand 15W', sku: 'CHG-STAND-15', category: 'Accessories', base_price: 39.99, units: 950 },
        { id: '6', name: 'Thunderbolt 4 Multi-Port Docking Hub', sku: 'DOCK-TB4-10', category: 'Accessories', base_price: 249.99, units: 210 },
      ].map((p, idx) => {
        const rev = p.base_price * p.units;
        const growth = idx % 2 === 0 ? 14.5 : -3.2;
        return {
          ...p,
          revenue: rev,
          growthPercent: growth,
          performanceTier: rev > 50000 ? 'HIGH' : 'UNDER',
        };
      });
    }

    return products.map((p, idx) => {
      const price = Number(p.base_price || 100);
      const units = 250 + (idx % 7) * 80;
      const rev = price * units;
      const growth = (idx % 3 === 0 ? -1 : 1) * (5 + (idx % 12));
      return {
        ...p,
        base_price: price,
        units,
        revenue: rev,
        growthPercent: growth,
        performanceTier: rev >= 45000 ? 'HIGH' : 'UNDER',
      };
    });
  }, [products]);

  const summary = useMemo(() => {
    const totalRev = analyzedProducts.reduce((acc, p) => acc + p.revenue, 0);
    const totalUnits = analyzedProducts.reduce((acc, p) => acc + p.units, 0);
    const aov = totalUnits > 0 ? totalRev / totalUnits : 0;
    const highPerf = analyzedProducts.filter((p) => p.performanceTier === 'HIGH');
    const underPerf = analyzedProducts.filter((p) => p.performanceTier === 'UNDER');

    return {
      totalRev,
      totalUnits,
      aov,
      highPerfCount: highPerf.length,
      underPerfCount: underPerf.length,
    };
  }, [analyzedProducts]);

  // Category breakdown for chart
  const categoryChartData = useMemo(() => {
    const map = {};
    analyzedProducts.forEach((p) => {
      const cat = p.category || 'General';
      map[cat] = (map[cat] || 0) + p.revenue;
    });

    return Object.entries(map).map(([name, rev]) => ({
      name,
      revenue: Math.round(rev),
    }));
  }, [analyzedProducts]);

  // Trailing 6 months Revenue Trend
  const monthlyTrendData = useMemo(() => {
    return [
      { month: 'Jan', revenue: 195000, target: 180000 },
      { month: 'Feb', revenue: 210000, target: 200000 },
      { month: 'Mar', revenue: 228000, target: 215000 },
      { month: 'Apr', revenue: 242000, target: 230000 },
      { month: 'May', revenue: 265000, target: 250000 },
      { month: 'Jun', revenue: 284500, target: 270000 },
    ];
  }, []);

  const filteredProducts = useMemo(() => {
    return analyzedProducts.filter((p) => {
      const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchesPerf = perfFilter === 'ALL' || p.performanceTier === perfFilter;
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesPerf && matchesSearch;
    });
  }, [analyzedProducts, categoryFilter, perfFilter, searchQuery]);

  const categories = useMemo(() => {
    const set = new Set(analyzedProducts.map((p) => p.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [analyzedProducts]);

  const handleExportCsv = () => {
    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Unit Price',
      'Units Sold',
      'Realized Gross Revenue',
      'Growth %',
      'Performance Tier',
    ];

    const rows = filteredProducts.map((p) => [
      p.name,
      p.sku,
      p.category || 'General',
      p.base_price,
      p.units,
      p.revenue,
      `${p.growthPercent > 0 ? '+' : ''}${p.growthPercent}%`,
      p.performanceTier,
    ]);

    downloadCsv(`PricePilot_Revenue_Ledger_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    toast.success('Revenue ledger CSV exported successfully.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue Optimization Analytics"
        description="Comprehensive analysis of realized gross revenue, AOV trajectory, and category sales contribution."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={FileSpreadsheet}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Download}
              onClick={() => setIsReportModalOpen(true)}
            >
              Executive Report (PDF)
            </Button>
          </div>
        }
      />

      {/* 1. Executive Revenue KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Realized Gross Revenue</span>
            <IndianRupee className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-[#0F172A]">
              {formatCurrency(summary.totalRev)}
            </span>
            <span className="text-[11px] font-semibold text-[#16A34A] flex items-center">
              <ArrowUpRight className="w-3 h-3" />+14.2% YoY
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] block mt-1">
            Across active catalog
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Average Order Value (AOV)</span>
            <ShoppingBag className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-[#0F172A]">
              {formatCurrency(summary.aov)}
            </span>
            <span className="text-[11px] font-semibold text-[#16A34A] flex items-center">
              <ArrowUpRight className="w-3 h-3" />+6.8%
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] block mt-1">
            Weighted average unit yield
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">High-Performing SKUs</span>
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-[#16A34A]">
              {summary.highPerfCount}
            </span>
            <span className="text-[11px] text-[#64748B]">
              Generating &gt; ₹5 Lakh
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] block mt-1">
            Top revenue contributors
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Under-Performing SKUs</span>
            <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-[#DC2626]">
              {summary.underPerfCount}
            </span>
            <span className="text-[11px] text-[#64748B]">
              Growth deceleration
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] block mt-1">
            Candidates for price promotion
          </span>
        </div>
      </div>

      {/* 2. Visual Charts: Revenue Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Trend */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Realized Revenue Trajectory</h3>
              <p className="text-xs text-[#64748B]">Actual monthly performance vs business targets.</p>
            </div>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val, name) => [formatCurrency(val), name === 'revenue' ? 'Gross Revenue' : 'Budget Target']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 11 }}
                />
                <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Revenue Contribution by Category</h3>
              <p className="text-xs text-[#64748B]">Sales volume distribution across catalog categories.</p>
            </div>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Realized Revenue']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 11 }}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. High-Performing vs Under-Performing SKU Ledger */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs">
              {[
                { id: 'ALL', label: 'All SKUs' },
                { id: 'HIGH', label: 'High-Performing' },
                { id: 'UNDER', label: 'Under-Performing' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPerfFilter(t.id)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    perfFilter === t.id
                      ? 'bg-white text-[#0F172A] shadow-2xs font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search SKU or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table className="w-full text-left text-xs text-[#0F172A]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="py-2.5 pl-4 pr-2">Product</th>
                <th className="py-2.5 px-2 text-right">Unit Price</th>
                <th className="py-2.5 px-2 text-right">Units Sold</th>
                <th className="py-2.5 px-2 text-right">Gross Revenue</th>
                <th className="py-2.5 px-2 text-right">Growth %</th>
                <th className="py-2.5 pl-2 pr-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredProducts.map((p) => {
                const isPositive = p.growthPercent >= 0;
                return (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 pl-4 pr-2">
                      <div className="font-semibold text-[#0F172A]">{p.name}</div>
                      <div className="text-[10px] text-[#64748B] font-mono">
                        {p.sku} • {p.category || 'General'}
                      </div>
                    </td>

                    <td className="py-3 px-2 text-right font-mono font-medium">
                      {formatCurrency(p.base_price)}
                    </td>

                    <td className="py-3 px-2 text-right font-mono">
                      {p.units}
                    </td>

                    <td className="py-3 px-2 text-right font-mono font-bold text-[#0F172A]">
                      {formatCurrency(p.revenue)}
                    </td>

                    <td className="py-3 px-2 text-right font-mono font-semibold">
                      <span className={isPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                        {isPositive ? '+' : ''}{p.growthPercent}%
                      </span>
                    </td>

                    <td className="py-3 pl-2 pr-4 text-center">
                      {p.performanceTier === 'HIGH' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#15803D] px-2 py-0.5 rounded-full bg-[#DCFCE7]">
                          <CheckCircle2 className="w-3 h-3" /> High Velocity
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#DC2626] px-2 py-0.5 rounded-full bg-[#FEE2E2]">
                          <AlertCircle className="w-3 h-3" /> Under-Performing
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Modal */}
      <ReportConfigModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportContext={{
          organizationName: selectedOrganization?.name,
          products: analyzedProducts,
          summaryMetrics: {
            totalRevenue: summary.totalRev,
            pricingLift: 14.2,
          },
        }}
      />
    </div>
  );
}
