import React from 'react';
import PageHeader from '../../../components/PageHeader';
import Card from '../../../components/Card';
import Badge from '../../../components/Badge';
import Button from '../../../components/Button';
import { Users, Building2, Shield, Info, Plus } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import AddMemberForm from '../components/AddMemberForm';
import { Link } from 'react-router-dom';

export default function TeamPage() {
  const { selectedOrganization, selectedOrganizationId, organizations, isLoading } = useOrganization();

  // If organizations are loading
  if (isLoading && !selectedOrganization) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-white rounded-2xl border border-[#E2E8F0] p-4" />
        <div className="h-64 bg-white rounded-2xl border border-[#E2E8F0]" />
      </div>
    );
  }

  // If no organization exists yet
  if (organizations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Team"
          subtitle="Manage members of your workspace."
        />
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight mb-2">
            No Workspace Selected
          </h2>
          <p className="text-sm text-[#64748B] mb-6 leading-relaxed max-w-md mx-auto">
            You must have an active organization workspace to invite and manage team members.
          </p>
          <Link to="/organization">
            <Button variant="primary" size="md" leftIcon={Plus}>
              Go to Organizations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        subtitle="Manage members of your workspace."
      />

      {/* Workspace Context Banner */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Active Workspace
              </span>
              <Badge variant="success" size="sm" dot>
                Isolated Tenant
              </Badge>
            </div>
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              {selectedOrganization?.name || 'Unnamed Organization'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
            ID: {selectedOrganizationId}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Add Member Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Add Team Member"
            subtitle="Grant workspace access via the FastAPI organization member registry"
          >
            <AddMemberForm organizationId={selectedOrganizationId} />
          </Card>
        </div>

        {/* Right Col: Role Permissions Info */}
        <div className="space-y-6">
          <Card
            title="Workspace Roles"
            subtitle="FastAPI RBAC authority levels"
          >
            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[#0F172A]">Admin</span>
                  <Badge variant="primary" size="sm">Full Access</Badge>
                </div>
                <p className="text-[#64748B] leading-relaxed">
                  Full control over organization settings, member management, and catalog pipelines.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[#0F172A]">Analyst</span>
                  <Badge variant="info" size="sm">Intelligence</Badge>
                </div>
                <p className="text-[#64748B] leading-relaxed">
                  Can evaluate elasticity models, approve pricing recommendations, and manage competitors.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[#0F172A]">Member</span>
                  <Badge variant="neutral" size="sm">Standard</Badge>
                </div>
                <p className="text-[#64748B] leading-relaxed">
                  Can view products, competitor price monitoring feeds, and forecasting summaries.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[#0F172A]">Viewer</span>
                  <Badge variant="neutral" size="sm">Read Only</Badge>
                </div>
                <p className="text-[#64748B] leading-relaxed">
                  Read-only view of executive summaries and generated PDF reports.
                </p>
              </div>
            </div>
          </Card>

          <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1D4ED8] flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#2563EB]" />
            <p className="leading-relaxed">
              FastAPI strictly verifies that authenticated users belong to this organization before granting access to catalog, competitor, or pricing endpoints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
