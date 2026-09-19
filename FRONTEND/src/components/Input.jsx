import React, { forwardRef } from 'react';

/**
 * Reusable Input Component
 * Clean 40-44px height, accessible labels, error and helper states
 */
const Input = forwardRef(function Input(
  {
    label,
    id,
    name,
    type = 'text',
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    helperText,
    error,
    disabled = false,
    required = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    inputClassName = '',
    autoComplete,
    ...props
  },
  ref
) {
  const inputId = id || (name ? `input-${name}` : undefined);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3.5 text-[#94A3B8] pointer-events-none flex items-center">
            <LeftIcon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={`w-full h-10.5 rounded-lg border bg-white px-3.5 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-0 disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed ${
            LeftIcon ? 'pl-10' : ''
          } ${RightIcon ? 'pr-10' : ''} ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
              : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2563EB]'
          } ${inputClassName}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />

        {RightIcon && (
          <div className="absolute right-3.5 text-[#94A3B8] flex items-center">
            <RightIcon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-[#DC2626] flex items-center gap-1">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-[#64748B]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
