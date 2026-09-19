import React from 'react';
import Button from './Button';

/**
 * Reusable EmptyState Component
 * Purposeful guidance with clear next actions instead of generic "No data"
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  secondaryActionText,
  onSecondaryAction,
  className = '',
  id,
}) {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white border border-[#E2E8F0] rounded-2xl ${className}`}
    >
      {Icon && (
        <div className="w-13 h-13 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center mb-4.5 shadow-xs">
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      )}

      <h3 className="text-[17px] font-semibold text-[#0F172A] tracking-tight mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-[#64748B] max-w-md mx-auto leading-relaxed mb-6">{description}</p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionText && onAction && (
          <Button variant="primary" onClick={onAction} leftIcon={actionIcon}>
            {actionText}
          </Button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction}>
            {secondaryActionText}
          </Button>
        )}
      </div>
    </div>
  );
}
