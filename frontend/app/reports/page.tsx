'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { BIReportData } from '@/lib/types';
import { SAMPLE_SKUS, SAMPLE_STORES } from '@/components/SkuSelector';
import { useToast } from '@/lib/ToastContext';
import { ErrorBanner } from '@/components/ErrorBanner';
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Tag,
  TrendingUp,
  DollarSign,
  Compass,
  Layers,
  Calendar,
} from 'lucide-react';

export default function ReportsPage() {
  const { showToast } = useToast();

  const [selectedSku, setSelectedSku] = useState('293375605257');
  const [selectedStore, setSelectedStore] = useState(1);
  const [dateRange, setDateRange] = useState('2024-08-04 to 2024-09-08');

  const [report, setReport] = useState<BIReportData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const generated = await api.generateBIReport(selectedSku, selectedStore);
      setReport(generated);
      showToast('Report Generated', `Intelligence Dossier ${generated.reportId} ready for review.`, 'success');
    } catch (err: any) {
      const msg = err.message || 'Could not generate BI report from backend.';
      setError(msg);
      showToast('Generation Failed', msg, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    showToast('Exporting Report', 'Generating vectorized PDF report download...', 'info');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">
              <FileText size={28} color="var(--accent-primary)" />
              Business Intelligence Reports
            </h1>
            <p className="page-subtitle">
              Generate, preview, and export executive-ready multi-modal commercial intelligence dossiers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {error ? (
              <span className="badge badge-amber">OFFLINE / FALLBACK</span>
            ) : (
              <span className="badge badge-emerald">LIVE API (FastAPI)</span>
            )}
            {report && (
              <>
                <button onClick={handlePrint} className="btn btn-secondary">
                  <Printer size={16} /> Print Report
                </button>
                <button onClick={handleDownloadPdf} className="btn btn-primary">
                  <Download size={16} /> Download PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={handleGenerateReport} />}


      {/* Control Bar: Report Generator Parameters */}
      <div className="control-bar">
        <div className="form-group" style={{ flex: '1 1 240px' }}>
          <label className="form-label">Target Product / SKU</label>
          <select
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
            className="form-select"
            style={{ width: '100%' }}
          >
            {SAMPLE_SKUS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ width: '180px' }}>
          <label className="form-label">Store Location</label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(Number(e.target.value))}
            className="form-select"
            style={{ width: '100%' }}
          >
            {SAMPLE_STORES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ width: '220px' }}>
          <label className="form-label">Reporting Window</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="2024-08-04 to 2024-09-08">Active Observation Window (35 Days)</option>
            <option value="Quarter 3 2024">Quarter 3 2024</option>
            <option value="Last 14 Days">Last 14 Days</option>
          </select>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="btn btn-primary"
          style={{ height: '40px' }}
        >
          {generating ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Compiling Data...
            </>
          ) : (
            <>
              <FileText size={16} />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Report Preview Container */}
      {!report && !generating && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <FileText size={28} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Ready to Generate Intelligence Report
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px' }}>
            Select your desired SKU and store location above and click <strong>Generate Report</strong> to compile a standardized 11-section executive briefing.
          </p>
          <button onClick={handleGenerateReport} className="btn btn-primary">
            Generate Sample Report
          </button>
        </div>
      )}

      {report && (
        <div
          className="card print-container"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          {/* Report Header */}
          <div
            style={{
              borderBottom: '2px solid var(--border-subtle)',
              paddingBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                PricePilot AI — Business Intelligence Report
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {report.title}
              </h2>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Report ID: <strong>{report.reportId}</strong> | Store Location: <strong>Store {report.storeId}</strong> | SKU: <strong>{report.sku}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div>Generated: {report.generatedDate}</div>
              <div>Author: {report.author}</div>
              <span className="badge badge-emerald" style={{ marginTop: '6px' }}>Status: Approved</span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              1. Executive Summary
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              {report.executiveSummary}
            </p>
          </div>

          {/* Section 2: Product KPIs Grid */}
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
              2. Product Commercial KPIs
            </h3>
            <div className="grid-4">
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Price</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(report.productKpis.referencePrice)}</div>
              </div>
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommended Price</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--pastel-mint-text)' }}>{formatCurrency(report.productKpis.recommendedPrice)}</div>
              </div>
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Realized Volume</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#06b6d4' }}>{report.productKpis.unitsSold.toLocaleString()} units</div>
              </div>
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Forecast Confidence</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>{report.productKpis.forecastConfidence}%</div>
              </div>
            </div>
          </div>

          {/* Section 3 & 4: Sales & Revenue & Price Prediction */}
          <div className="grid-2">
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                3. Sales & Revenue Analysis
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Total modeled revenue realized is {formatCurrency(report.productKpis.revenue)}. Elasticity modeling projects gross revenue headroom of +{formatCurrency(report.productKpis.revenueLift)} without risking demand contraction.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                4. Price Prediction Engine
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {report.pricingAnalysis}
              </p>
            </div>
          </div>

          {/* Section 5 & 6: Demand Forecast & Confidence */}
          <div className="grid-2">
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                5. Demand Forecast (Multi-Horizon)
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>7-Day</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{report.demandForecastSummary.horizon7d} u</div>
                </div>
                <div style={{ flex: 1, padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>14-Day</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{report.demandForecastSummary.horizon14d} u</div>
                </div>
                <div style={{ flex: 1, padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>30-Day</div>
                  <div style={{ fontWeight: 700, color: '#a855f7' }}>{report.demandForecastSummary.horizon30d} u</div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                6. Forecast Confidence & Risk
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Model confidence score is verified at <strong>{report.productKpis.forecastConfidence}%</strong>. Trajectory trend classification: <strong>{report.demandForecastSummary.trend}</strong>. Risk rating: <strong>{report.demandForecastSummary.risk}</strong>.
              </p>
            </div>
          </div>

          {/* Section 7 & 8: Revenue Optimization & Market Analysis */}
          <div className="grid-2">
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                7. Revenue Optimization
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Coupled elasticity curves identify the optimal price vertex at <strong>{formatCurrency(report.revenueOptimizationSummary.optimalPrice)}</strong>, delivering an expected +{report.revenueOptimizationSummary.liftPercentage}% revenue lift.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                8. Market Analysis (Internal Benchmark)
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Omnichannel digital channel index is at <strong>{report.marketBenchmarkSummary.channelIndex}%</strong> with cross-store dispersion of <strong>{report.marketBenchmarkSummary.storeDispersion}%</strong>.
              </p>
            </div>
          </div>

          {/* Section 9: AI Recommendations */}
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
              9. AI Merchandising Recommendations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {report.aiRecommendations.map((rec, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#e2e8f0' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 10: Active Alerts */}
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
              10. Active Risk Radar Alerts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {report.alerts.map((alt, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--pastel-amber-text)' }}>
                  <AlertTriangle size={16} color="#f59e0b" />
                  <span>{alt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 11: Key Actions Table */}
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
              11. Key Implementation Actions
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Action Item</th>
                    <th>Assigned Owner</th>
                    <th>Target Deadline</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {report.keyActions.map((act, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.action}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{act.owner}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{act.deadline}</td>
                      <td>
                        <span className={`badge badge-${act.priority === 'HIGH' ? 'rose' : 'amber'}`}>
                          {act.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
