import React from 'react';

/**
 * Reusable Badge Component
 * Variants: default/neutral, primary, success, warning, danger
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  id,
}) {
  const variantStyles = {
    default: 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]',
    primary: 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]',
    success: 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]',
    warning: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]',
    danger: 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]',
  };

  const dotColors = {
    default: 'bg-[#64748B]',
    primary: 'bg-[#2563EB]',
    success: 'bg-[#16A34A]',
    warning: 'bg-[#F59E0B]',
    danger: 'bg-[#DC2626]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full font-medium',
    md: 'text-[12px] px-2.5 py-1 rounded-full font-medium',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${variantStyles[variant] || variantStyles.default} ${
        sizeStyles[size] || sizeStyles.md
      } ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
