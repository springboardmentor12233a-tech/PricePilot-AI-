import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 sm:p-12 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center mx-auto mb-5">
          <FileQuestion className="w-7 h-7" />
        </div>

        <span className="text-xs font-semibold text-[#2563EB] tracking-wider uppercase">
          404 Error
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mt-1 mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed mb-6">
          The requested route does not exist or has been relocated within the PricePilot AI navigation tree.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/dashboard')} leftIcon={ArrowLeft}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
