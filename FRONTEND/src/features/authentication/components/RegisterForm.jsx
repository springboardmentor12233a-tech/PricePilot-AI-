import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import PasswordField from './PasswordField';
import {
  User,
  Mail,
  Building2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export default function RegisterForm() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [detectedDomain, setDetectedDomain] = useState('');

  // Live Company Domain Detection
  const detectCompanyDomain = (emailStr) => {
    if (!emailStr || !emailStr.includes('@')) {
      setDetectedDomain('');
      return;
    }
    const domain = emailStr.split('@')[1]?.toLowerCase().trim();
    const genericDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
    if (domain && domain.includes('.') && !genericDomains.includes(domain)) {
      setDetectedDomain(domain);
      // Auto-populate company name if empty
      if (!formData.companyName) {
        const rawName = domain.split('.')[0];
        const formatted = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        setFormData((prev) => ({ ...prev, companyName: formatted }));
      }
    } else {
      setDetectedDomain('');
    }
  };

  // Password Strength Evaluation
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-[#E2E8F0]', textColor: 'text-[#94A3B8]' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { score: 1, label: 'Weak', color: 'bg-[#DC2626]', textColor: 'text-[#DC2626]', width: '25%' };
    }
    if (score === 3) {
      return { score: 2, label: 'Fair', color: 'bg-[#EAB308]', textColor: 'text-[#CA8A04]', width: '50%' };
    }
    if (score === 4) {
      return { score: 3, label: 'Good', color: 'bg-[#2563EB]', textColor: 'text-[#2563EB]', width: '75%' };
    }
    return { score: 4, label: 'Strong', color: 'bg-[#16A34A]', textColor: 'text-[#16A34A]', width: '100%' };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const validate = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Work email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid work email address.';
    }

    if (!formData.companyName.trim()) {
      errors.companyName = 'Company or Organization name is required.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm Password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.agreedToTerms) {
      errors.agreedToTerms = 'You must accept the Enterprise Service Agreement.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: val }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) setApiError('');
    if (name === 'email') {
      detectCompanyDomain(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    try {
      // Send the backend-supported fields: email, password, full_name
      const response = await register({
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.fullName.trim(),
      });

      // Save company name in local storage for onboarding initial setup
      if (formData.companyName) {
        try {
          localStorage.setItem('pricepilot_pending_org_name', formData.companyName.trim());
        } catch (_) {}
      }

      if (response?.access_token) {
        toast.success('Workspace created and authenticated successfully.');
        navigate('/dashboard');
      } else {
        toast.success('Organization registered successfully. Please sign in.');
        navigate('/login');
      }
    } catch (err) {
      const errorMsg =
        err.message || 'Unable to register organization. Please verify your details.';
      setApiError(errorMsg);
    }
  };

  const handleQuickSeed = () => {
    const randomId = Math.floor(100 + Math.random() * 900);
    const demoEmail = `admin${randomId}@enterprise-pilot.in`;
    setFormData({
      fullName: 'Vikram Malhotra',
      email: demoEmail,
      companyName: 'Malhotra Retail India Pvt Ltd',
      password: 'PricePilotSecure2026!',
      confirmPassword: 'PricePilotSecure2026!',
      agreedToTerms: true,
    });
    detectCompanyDomain(demoEmail);
    setFormErrors({});
    setApiError('');
    toast.info('Sample enterprise registration filled.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full" noValidate>
      {/* API Level Error Notification */}
      {apiError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-start gap-2.5 animate-in fade-in-50"
        >
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">Registration Error</p>
            <p className="mt-0.5 leading-relaxed text-[#B91C1C]">{apiError}</p>
          </div>
        </div>
      )}

      {/* Full Name */}
      <Input
        label="Full Name"
        name="fullName"
        type="text"
        autoComplete="name"
        placeholder="Aditya Sharma"
        value={formData.fullName}
        onChange={handleChange}
        error={formErrors.fullName}
        leftIcon={User}
        disabled={isLoading}
        required
      />

      {/* Work Email */}
      <div className="space-y-1">
        <Input
          label="Work Email Address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          value={formData.email}
          onChange={handleChange}
          error={formErrors.email}
          leftIcon={Mail}
          disabled={isLoading}
          required
        />

        {detectedDomain && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-medium text-[#1D4ED8] animate-in fade-in-50">
            <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Enterprise Workspace: <strong className="font-semibold">{detectedDomain}</strong></span>
          </div>
        )}
      </div>

      {/* Company / Organization Name */}
      <Input
        label="Company / Organization Name"
        name="companyName"
        type="text"
        autoComplete="organization"
        placeholder="Acme Retail India Ltd."
        value={formData.companyName}
        onChange={handleChange}
        error={formErrors.companyName}
        leftIcon={Building2}
        disabled={isLoading}
        required
      />

      {/* Password with Strength Meter */}
      <div className="space-y-1.5">
        <PasswordField
          label="Password"
          name="password"
          placeholder="Min. 8 characters"
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
          disabled={isLoading}
          required
        />

        {/* Live Password Strength Meter */}
        {formData.password && (
          <div className="pt-1 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#64748B]">Password Strength:</span>
              <span className={`font-bold ${passwordStrength.textColor}`}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className={`h-full ${passwordStrength.color} transition-all duration-300 rounded-full`}
                style={{ width: passwordStrength.width }}
              />
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-[#64748B] pt-0.5">
              <span className={formData.password.length >= 8 ? 'text-[#16A34A] flex items-center gap-1' : 'flex items-center gap-1'}>
                {formData.password.length >= 8 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} At least 8 characters
              </span>
              <span className={/[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) ? 'text-[#16A34A] flex items-center gap-1' : 'flex items-center gap-1'}>
                {/[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Uppercase & number
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          placeholder="Repeat your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={formErrors.confirmPassword}
          disabled={isLoading}
          required
        />
        {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
          <p className="text-[11px] text-[#16A34A] font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
          </p>
        )}
      </div>

      {/* Terms & Privacy Agreement Checkbox */}
      <div className="pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-[#475569]">
          <input
            type="checkbox"
            name="agreedToTerms"
            checked={formData.agreedToTerms}
            onChange={handleChange}
            className="w-4 h-4 mt-0.5 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
          />
          <span className="leading-snug">
            I agree to the{' '}
            <span className="text-[#2563EB] underline font-medium">Enterprise Service Agreement</span>,{' '}
            <span className="text-[#2563EB] underline font-medium">Data Privacy Policy</span>, and agree to organization-scoped data governance.
          </span>
        </label>
        {formErrors.agreedToTerms && (
          <p className="text-[11px] text-[#DC2626] font-medium mt-1">
            {formErrors.agreedToTerms}
          </p>
        )}
      </div>

      {/* Submit Button & Auto-Fill Demo Option */}
      <div className="pt-2 space-y-2.5">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full h-11 text-sm font-semibold"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Creating Enterprise Account...' : 'Create Enterprise Account'}
        </Button>

        {/* Demo Organization Quick-Fill */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#64748B]">
          <span className="truncate">Need test data?</span>
          <button
            type="button"
            onClick={handleQuickSeed}
            className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-[#2563EB]" />
            Auto-fill demo organization
          </button>
        </div>
      </div>

      {/* Sign In Link */}
      <div className="text-center pt-3 border-t border-[#F1F5F9]">
        <p className="text-xs text-[#64748B]">
          Already have an enterprise account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );
}
