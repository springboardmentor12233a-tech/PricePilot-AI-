import React, { useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import Card from '../../../components/Card';
import Badge from '../../../components/Badge';
import Button from '../../../components/Button';
import {
  Building2,
  Info,
  Plus,
  Check,
  Minus,
  ChevronDown,
  Lightbulb,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import AddMemberForm from '../components/AddMemberForm';
import { Link } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/* Role data (drives the role picker, the compare table and the tips)   */
/* ------------------------------------------------------------------ */

const ROLES = [
  {
    key: 'admin',
    name: 'Admin',
    badge: { variant: 'primary', text: 'Full Access' },
    dot: 'bg-[#2563EB]',
    text: 'Full control over organization settings, member management, and catalog pipelines.',
    bestFor: 'Workspace owners and operations leads who manage people and settings.',
  },
  {
    key: 'analyst',
    name: 'Analyst',
    badge: { variant: 'info', text: 'Intelligence' },
    dot: 'bg-[#0EA5E9]',
    text: 'Can evaluate elasticity models, approve pricing recommendations, and manage competitors.',
    bestFor: 'Pricing and revenue analysts who make day-to-day pricing decisions.',
  },
  {
    key: 'member',
    name: 'Member',
    badge: { variant: 'neutral', text: 'Standard' },
    dot: 'bg-[#64748B]',
    text: 'Can view products, competitor price monitoring feeds, and forecasting summaries.',
    bestFor: 'Category and product managers who need visibility without edit rights.',
  },
  {
    key: 'viewer',
    name: 'Viewer',
    badge: { variant: 'neutral', text: 'Read Only' },
    dot: 'bg-[#CBD5E1]',
    text: 'Read-only view of executive summaries and generated PDF reports.',
    bestFor: 'Executives, stakeholders and auditors who only read reports.',
  },
];

// Capabilities derived from the role descriptions above
const CAPABILITIES = [
  { label: 'Manage organization settings', roles: ['admin'] },
  { label: 'Manage members', roles: ['admin'] },
  { label: 'Manage catalog pipelines', roles: ['admin'] },
  { label: 'Manage competitors', roles: ['admin', 'analyst'] },
  { label: 'Evaluate elasticity models', roles: ['admin', 'analyst'] },
  { label: 'Approve pricing recommendations', roles: ['admin', 'analyst'] },
  { label: 'View products & competitor feeds', roles: ['admin', 'analyst', 'member'] },
  { label: 'View forecasting summaries', roles: ['admin', 'analyst', 'member'] },
  { label: 'View executive summaries & PDF reports', roles: ['admin', 'analyst', 'member', 'viewer'] },
];

const STEPS = [
  { icon: Mail, title: 'Enter details', text: 'Add the teammate\u2019s email.' },
  { icon: ShieldCheck, title: 'Choose a role', text: 'Pick the least access they need.' },
  { icon: UserPlus, title: 'Access granted', text: 'They join this workspace.' },
];

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function StepsStrip() {
  return (
    <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-3" aria-label="How adding a member works">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <li
            key={step.title}
            className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
          >
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2563EB] ring-1 ring-[#E2E8F0]">
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0F172A] text-[9px] font-bold text-white">
                {i + 1}
              </span>
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0F172A]">{step.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-[#64748B]">{step.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ViewToggle({ view, onChange }) {
  const options = [
    { key: 'cards', label: 'Roles' },
    { key: 'matrix', label: 'Compare' },
  ];
  return (
    <div
      role="group"
      aria-label="Roles view"
      className="mb-4 inline-flex rounded-xl bg-[#F1F5F9] p-1"
    >
      {options.map((o) => {
        const active = view === o.key;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.key)}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 ${
              active ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function RolePicker({ selected, onSelect }) {
  return (
    <div role="radiogroup" aria-label="Workspace roles" className="space-y-2.5 text-xs">
      {ROLES.map((role) => {
        const isSelected = selected === role.key;
        const caps = CAPABILITIES.filter((c) => c.roles.includes(role.key));
        return (
          <div
            key={role.key}
            className={`rounded-xl border transition-all duration-200 ${
              isSelected
                ? 'border-[#93C5FD] bg-[#F8FBFF] shadow-[0_0_0_3px_rgba(37,99,235,0.08)]'
                : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1]'
            }`}
          >
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(isSelected ? null : role.key)}
              className="flex w-full cursor-pointer items-start gap-3 rounded-xl p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${role.dot}`} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#0F172A]">{role.name}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant={role.badge.variant} size="sm">
                      {role.badge.text}
                    </Badge>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-[#94A3B8] transition-transform duration-200 ${
                        isSelected ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </span>
                <span className="block leading-relaxed text-[#64748B]">{role.text}</span>
              </span>
            </button>

            {isSelected && (
              <div className="border-t border-[#E2E8F0] px-3 pb-3 pt-2.5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  What they can do
                </p>
                <ul className="space-y-1.5">
                  {caps.map((c) => (
                    <li key={c.label} className="flex items-start gap-2 text-[#334155]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#059669]" aria-hidden="true" />
                      <span>{c.label}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 rounded-lg bg-white px-2.5 py-2 text-[11px] leading-relaxed text-[#64748B] ring-1 ring-[#E2E8F0]">
                  <span className="font-semibold text-[#0F172A]">Best for: </span>
                  {role.bestFor}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RoleMatrix() {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[320px] border-separate border-spacing-0 text-xs">
        <caption className="sr-only">Capabilities by workspace role</caption>
        <thead>
          <tr>
            <th scope="col" className="pb-2 pl-1 pr-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Capability
            </th>
            {ROLES.map((r) => (
              <th
                key={r.key}
                scope="col"
                className="px-1 pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[#64748B]"
              >
                {r.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CAPABILITIES.map((cap, i) => (
            <tr key={cap.label} className={i % 2 === 0 ? 'bg-[#F8FAFC]' : ''}>
              <th
                scope="row"
                className="rounded-l-lg py-2 pl-2 pr-2 text-left font-medium leading-snug text-[#334155]"
              >
                {cap.label}
              </th>
              {ROLES.map((r, j) => {
                const has = cap.roles.includes(r.key);
                return (
                  <td
                    key={r.key}
                    className={`px-1 py-2 text-center ${j === ROLES.length - 1 ? 'rounded-r-lg' : ''}`}
                  >
                    {has ? (
                      <Check className="mx-auto h-4 w-4 text-[#059669]" aria-label="Allowed" />
                    ) : (
                      <Minus className="mx-auto h-4 w-4 text-[#CBD5E1]" aria-label="Not allowed" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function TeamPage() {
  const { selectedOrganization, selectedOrganizationId, organizations, isLoading } = useOrganization();

  const [selectedRole, setSelectedRole] = useState(null);
  const [rolesView, setRolesView] = useState('cards'); // 'cards' | 'matrix'

  const activeRole = ROLES.find((r) => r.key === selectedRole);

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
            <div className="space-y-5">
              <StepsStrip />

              {/* Role chosen in the Workspace Roles card */}
              {activeRole && (
                <div
                  role="status"
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 py-2.5 text-xs text-[#1D4ED8]"
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${activeRole.dot}`} aria-hidden="true" />
                    Selected role: <strong className="font-semibold">{activeRole.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedRole(null)}
                    className="cursor-pointer font-semibold underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
                  >
                    Clear
                  </button>
                </div>
              )}

              <AddMemberForm
                organizationId={selectedOrganizationId}
                defaultRole={selectedRole || undefined}
              />

              <div className="flex items-start gap-2.5 rounded-xl bg-[#FFFBEB] px-3.5 py-3 text-xs text-[#92400E] ring-1 ring-inset ring-[#FDE68A]">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" aria-hidden="true" />
                <p className="leading-relaxed">
                  <span className="font-semibold">Tip:</span> start with the least access a person
                  needs. You can always grant more later, and it keeps your workspace safer.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Role Permissions Info */}
        <div className="space-y-6">
          <Card
            title="Workspace Roles"
            subtitle="FastAPI RBAC authority levels"
          >
            <ViewToggle view={rolesView} onChange={setRolesView} />

            {rolesView === 'cards' ? (
              <RolePicker selected={selectedRole} onSelect={setSelectedRole} />
            ) : (
              <RoleMatrix />
            )}
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