import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable Select Component
 */
const Select = forwardRef(function Select(
  {
    label,
    id,
    name,
    value,
    defaultValue,
    onChange,
    options = [],
    placeholder,
    helperText,
    error,
    disabled = false,
    required = false,
    className = '',
    selectClassName = '',
    ...props
  },
  ref
) {
  const selectId = id || (name ? `select-${name}` : undefined);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full h-10.5 rounded-lg border bg-white px-3.5 pr-10 text-sm text-[#0F172A] transition-all duration-150 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed cursor-pointer ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626]'
              : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2563EB]'
          } ${selectClassName}`}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3.5 pointer-events-none text-[#94A3B8]">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-[#DC2626]">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-[#64748B]">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;
