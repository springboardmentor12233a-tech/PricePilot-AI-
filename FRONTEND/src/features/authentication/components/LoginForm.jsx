import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import PasswordField from './PasswordField';
import { Mail, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const fromRoute = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      toast.success('Successfully signed in.');
      navigate(fromRoute, { replace: true });
    } catch (err) {
      const errorMsg =
        err.message || 'Invalid email or password. Please verify your credentials.';
      setApiError(errorMsg);
    }
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
      <Input
        label="Email Address"
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
            onClick={() => toast.info('Password reset instructions will be provided by your administrator.')}
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
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>

        {/* Dummy Credentials Quick Filler for Testing */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#64748B]">
          <span className="truncate">Test Credentials: <code className="text-[#0F172A] font-mono text-[11px]">{import.meta.env.VITE_TEST_USER_EMAIL || 'test@pricepilot.ai'}</code></span>
          <button
            type="button"
            onClick={() => {
              setFormData({
                email: import.meta.env.VITE_TEST_USER_EMAIL || 'test@pricepilot.ai',
                password: import.meta.env.VITE_TEST_USER_PASSWORD || 'TestPass123!',
              });
              setFormErrors({});
              setApiError('');
              toast.info('Test credentials filled.');
            }}
            className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] shrink-0 ml-2 cursor-pointer"
          >
            Auto-fill
          </button>
        </div>
      </div>

      {/* Registration Link */}
      <div className="text-center pt-3 border-t border-[#F1F5F9]">
        <p className="text-xs text-[#64748B]">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </form>
  );
}
