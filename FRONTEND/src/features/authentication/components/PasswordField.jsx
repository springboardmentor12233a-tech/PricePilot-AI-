import React, { useState, forwardRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

/**
 * Reusable PasswordField Component with visibility toggle
 * Accessible, keyboard supported, consistent with PricePilot AI design system.
 */
const PasswordField = forwardRef(function PasswordField(
  {
    label = 'Password',
    id,
    name = 'password',
    value,
    onChange,
    onBlur,
    onFocus,
    placeholder = '••••••••',
    helperText,
    error,
    disabled = false,
    required = false,
    autoComplete = 'current-password',
    className = '',
    inputClassName = '',
    showLockIcon = true,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `password-${name}`;

  const toggleVisibility = () => {
    if (!disabled) {
      setShowPassword((prev) => !prev);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {showLockIcon && (
          <div className="absolute left-3.5 text-[#94A3B8] pointer-events-none flex items-center">
            <Lock className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={`w-full h-10.5 rounded-lg border bg-white px-3.5 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-0 disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed ${
            showLockIcon ? 'pl-10' : ''
          } pr-11 ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
              : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2563EB]'
          } ${inputClassName}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />

        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-2.5 w-8 h-8 flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
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

export default PasswordField;
