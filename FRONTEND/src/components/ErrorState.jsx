import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Button from './Button';

/**
 * Reusable ErrorState Component
 * Displays friendly, actionable error information with retry capability
 */
export default function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while communicating with the backend.',
  onRetry,
  retryText = 'Retry Request',
  className = '',
  id,
}) {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white border border-[#FECACA] rounded-2xl ${className}`}
      role="alert"
    >
      <div className="w-13 h-13 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] flex items-center justify-center mb-4.5 shadow-xs">
        <AlertTriangle className="w-6 h-6" aria-hidden="true" />
      </div>

      <h3 className="text-[17px] font-semibold text-[#0F172A] tracking-tight mb-1.5">{title}</h3>
      <p className="text-sm text-[#64748B] max-w-md mx-auto leading-relaxed mb-6">{message}</p>

      {onRetry && (
        <Button variant="outline" onClick={onRetry} leftIcon={RotateCcw}>
          {retryText}
        </Button>
      )}
    </div>
  );
}
