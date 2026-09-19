import React from 'react';
import PageHeader from '../../../components/PageHeader';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';
import { Settings, Save, Server, Shield, Bell } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export default function SettingsPage() {
  const toast = useToast();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & System Configuration"
        description="Configure application preferences, API connectivity, notification alerts, and security credentials."
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={Save}
            onClick={() => toast.success('Settings updated successfully.')}
          >
            Save Preferences
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* API Gateway Card */}
          <Card
            title="FastAPI Backend Gateway"
            subtitle="Endpoint configuration for external API requests"
            action={<Badge variant="success" dot>Configured</Badge>}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#0F172A] mb-1">
                  API Base URL (VITE_API_BASE_URL)
                </label>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#0F172A] flex items-center justify-between">
                  <span>{import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}</span>
                  <span className="text-[11px] text-[#16A34A] font-sans font-medium">Active Target</span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1.5">
                  The frontend automatically reads this environment variable and prefixes all feature API calls without hardcoding URLs.
                </p>
              </div>

              <div className="pt-2 border-t border-[#F1F5F9]">
                <h4 className="text-xs font-semibold text-[#0F172A] mb-2">Available Backend Endpoints:</h4>
                <ul className="text-xs text-[#64748B] space-y-1 font-mono">
                  <li>• /api/v1/auth/ (register, login, me)</li>
                  <li>• /api/v1/products/ (catalog, variants, inventory)</li>
                  <li>• /api/v1/competitors/ (matching, price observations)</li>
                  <li>• /api/v1/pricing/ (predict, recommendations, history)</li>
                  <li>• /api/v1/sales/ (analytics, transactions)</li>
                  <li>• /api/v2/ai/ (gemini, grok, predictive intelligence)</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Pricing Automation Safeguards */}
          <Card
            title="Pricing Automation Guardrails"
            subtitle="Hard constraints enforced before applying any recommendation"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#0F172A]">Minimum Gross Margin Floor</p>
                  <p className="text-[#64748B]">Prevent any price recommendation below cost threshold</p>
                </div>
                <span className="font-semibold text-[#0F172A] px-2.5 py-1 bg-white rounded border border-[#E2E8F0]">
                  15.0%
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#0F172A]">Maximum Daily Price Delta</p>
                  <p className="text-[#64748B]">Cap allowable price fluctuations within 24 hours</p>
                </div>
                <span className="font-semibold text-[#0F172A] px-2.5 py-1 bg-white rounded border border-[#E2E8F0]">
                  ± 8.0%
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Security & Token Info" subtitle="Session state">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Auth Scheme</span>
                <span className="font-mono text-[#0F172A]">Bearer JWT</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Interceptors</span>
                <span className="font-semibold text-[#16A34A]">Active (401/403/422/500)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#64748B]">Design Archetype</span>
                <span className="font-semibold text-[#0F172A]">Enterprise Minimal</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
