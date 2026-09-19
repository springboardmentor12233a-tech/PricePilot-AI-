import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Reusable Button Component
 * Variants: primary, secondary, outline, ghost, danger
 * States: default, hover, active, focus, disabled, loading
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  onClick,
  id,
  ariaLabel,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ease-in-out select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5 min-h-[32px]',
    md: 'h-10 px-4 text-sm gap-2 min-h-[40px]',
    lg: 'h-11 px-5 text-base gap-2.5 min-h-[44px]',
  };

  const variantStyles = {
    primary:
      'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF] focus-visible:ring-[#2563EB] shadow-xs',
    secondary:
      'bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] focus-visible:ring-[#94A3B8]',
    outline:
      'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] active:bg-[#F1F5F9] focus-visible:ring-[#2563EB] shadow-xs',
    ghost:
      'bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] focus-visible:ring-[#94A3B8]',
    danger:
      'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] focus-visible:ring-[#DC2626] shadow-xs',
  };

  return (
    <button
      id={id}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="xs" color={variant === 'primary' || variant === 'danger' ? 'white' : 'currentColor'} />
          <span>{children}</span>
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" aria-hidden="true" />}
          <span>{children}</span>
          {RightIcon && <RightIcon className="w-4 h-4 shrink-0" aria-hidden="true" />}
        </>
      )}
    </button>
  );
}
