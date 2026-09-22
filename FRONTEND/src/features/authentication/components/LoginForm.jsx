import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import PasswordField from './PasswordField';
import { Mail, AlertCircle, Building2, Check, Lock, ShieldCheck } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [detectedDomain, setDetectedDomain] = useState('');

  const fromRoute = location.state?.from?.pathname || '/dashboard';

  // Load saved email if remembered
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('pricepilot_remember_email');
      if (savedEmail) {
        setFormData((prev) => ({ ...prev, email: savedEmail }));
        setRememberMe(true);
        detectCompanyDomain(savedEmail);
      }
    } catch (_) {}
  }, []);

  const detectCompanyDomain = (emailStr) => {
    if (!emailStr || !emailStr.includes('@')) {
      setDetectedDomain('');
      return;
    }
    const domain = emailStr.split('@')[1]?.toLowerCase().trim();
    const genericDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
    if (domain && domain.includes('.') && !genericDomains.includes(domain)) {
      setDetectedDomain(domain);
    } else {
      setDetectedDomain('');
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Work email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid work email address.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      if (rememberMe) {
        localStorage.setItem('pricepilot_remember_email', formData.email.trim());
      } else {
        localStorage.removeItem('pricepilot_remember_email');
      }

      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      toast.success('Successfully signed in.');
      navigate(fromRoute, { replace: true });
    } catch (err) {
      const errorMsg =
        err.message || 'Invalid credentials or organization access restricted. Please check your credentials.';
      setApiError(errorMsg);
    }
  };

  const handleAutoFillTest = () => {
    const testEmail = import.meta.env.VITE_TEST_USER_EMAIL || 'test@pricepilot.ai';
    const testPass = import.meta.env.VITE_TEST_USER_PASSWORD || 'TestPass123!';
    setFormData({
      email: testEmail,
      password: testPass,
    });
    detectCompanyDomain(testEmail);
    setFormErrors({});
    setApiError('');
    toast.info('Test credentials loaded.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4.5 w-full" noValidate>
      {/* API Level Error Notification */}
      {apiError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-start gap-2.5 animate-in fade-in-50"
        >
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">Authentication Error</p>
            <p className="mt-0.5 leading-relaxed text-[#B91C1C]">{apiError}</p>
          </div>
        </div>
      )}

      {/* Email Address */}
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

        {/* Corporate Domain Recognition Badge */}
        {detectedDomain && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-medium text-[#1D4ED8] animate-in fade-in-50">
            <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Enterprise Workspace: <strong className="font-semibold">{detectedDomain}</strong></span>
          </div>
        )}
      </div>

      {/* Password with Visibility Toggle */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="password-password"
            className="block text-[13px] font-medium text-[#0F172A]"
          >
            Password <span className="text-[#DC2626]">*</span>
          </label>
          <button
            type="button"
            onClick={() => toast.info('Password reset instructions will be provided by your enterprise workspace admin.')}
            className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        <PasswordField
          label=""
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
          disabled={isLoading}
          required
        />
      </div>

      {/* Remember Me & Workspace Persistence */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#475569]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
          />
          <span>Remember work email & workspace</span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="pt-2 space-y-2.5">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full h-11 text-sm font-semibold"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Authenticating...' : 'Sign In to PricePilot AI'}
        </Button>

        {/* Test Credentials Quick Filler */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#64748B]">
          <span className="truncate">
            Test Account: <code className="text-[#0F172A] font-mono text-[11px]">test@pricepilot.ai</code>
          </span>
          <button
            type="button"
            onClick={handleAutoFillTest}
            className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] shrink-0 ml-2 cursor-pointer"
          >
            Auto-fill
          </button>
        </div>
      </div>

      {/* Registration Link */}
      <div className="text-center pt-3 border-t border-[#F1F5F9]">
        <p className="text-xs text-[#64748B]">
          Need an organization account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
          >
            Create an enterprise workspace
          </Link>
        </p>
      </div>
    </form>
  );
}
