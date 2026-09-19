import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Plus, Check, Loader2, Sparkles } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import CreateOrganizationModal from './CreateOrganizationModal';

export default function OrganizationSelector({ className = '' }) {
  const {
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    selectOrganization,
    isLoading,
    isSwitching,
  } = useOrganization();

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (orgId) => {
    selectOrganization(orgId);
    setIsOpen(false);
  };

  const handleOpenCreateModal = () => {
    setIsOpen(false);
    setIsModalOpen(true);
  };

  // Skeleton loading state
  if (isLoading && organizations.length === 0) {
    return (
      <div className={`flex items-center gap-2 h-10 px-3 rounded-xl border border-[#E2E8F0] bg-white animate-pulse min-w-[160px] ${className}`}>
        <div className="w-4 h-4 rounded-md bg-[#F1F5F9]" />
        <div className="w-24 h-3.5 rounded-md bg-[#F1F5F9]" />
      </div>
    );
  }

  const currentOrgName = selectedOrganization?.name || 'No organization yet';

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Select organization workspace"
          className="flex items-center gap-2.5 h-10 px-3 sm:px-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all text-xs sm:text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer max-w-[200px] sm:max-w-[240px] truncate"
        >
          {isSwitching ? (
            <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          )}

          <span className="truncate text-left flex-1 font-semibold">
            {currentOrgName}
          </span>

          <ChevronDown
            className={`w-4 h-4 text-[#94A3B8] shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#2563EB]' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            role="listbox"
            aria-label="Organizations"
            className="absolute left-0 mt-2 w-72 max-h-96 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-1.5 z-50 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150"
          >
            <div className="px-3 py-2 border-b border-[#F1F5F9] mb-1">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Workspaces ({organizations.length})
              </p>
            </div>

            {organizations.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-[#64748B] mb-2 font-medium">No organization yet</p>
                <p className="text-[11px] text-[#94A3B8] mb-3 leading-relaxed">
                  Create a workspace to start managing pricing intelligence.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Organization</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {organizations.map((org) => {
                  const isSelected = String(org.id) === String(selectedOrganizationId);
                  return (
                    <button
                      key={org.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(org.id)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer min-h-[44px] ${
                        isSelected
                          ? 'bg-[#EFF6FF] text-[#2563EB] font-medium'
                          : 'text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-semibold truncate leading-tight">
                            {org.name}
                          </p>
                          {org.slug && (
                            <p className="text-[11px] text-[#64748B] font-mono truncate mt-0.5">
                              {org.slug}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                      )}
                    </button>
                  );
                })}

                <div className="border-t border-[#F1F5F9] my-1" />

                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] transition-colors cursor-pointer min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Organization</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateOrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
