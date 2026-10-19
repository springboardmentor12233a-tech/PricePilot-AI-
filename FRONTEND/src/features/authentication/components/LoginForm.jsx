import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import PasswordField from './PasswordField';
import { Mail, AlertCircle, Building2 } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyOtp, resendOtp, isLoading } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [detectedDomain, setDetectedDomain] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const resendInFlight = useRef(false);
  const loginInFlight = useRef(false);
  const verifyInFlight = useRef(false);

  const fromRoute = location.state?.from?.pathname || '/dashboard';
  const canAutofillTest = Boolean(
    import.meta.env.DEV &&
    import.meta.env.VITE_TEST_USER_EMAIL &&
    import.meta.env.VITE_TEST_USER_PASSWORD
  );

  useEffect(() => {
    if (!challengeId || resendCountdown <= 0) return undefined;
    const timer = window.setTimeout(() => setResendCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [challengeId, resendCountdown]);

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
    if (loginInFlight.current || isLoading) return;
    setApiError('');
    if (!validate()) return;
    loginInFlight.current = true;

    try {
      if (rememberMe) {
        localStorage.setItem('pricepilot_remember_email', formData.email.trim());
      } else {
        localStorage.removeItem('pricepilot_remember_email');
      }

      const challenge = await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      setChallengeId(challenge.challenge_id);
      setOtpValue('');
      setResendCountdown(challenge.resend_after_seconds || 60);
    } catch (err) {
      const errorMsg =
        err.message || 'Unable to start sign-in. Please check your details and try again.';
      setApiError(errorMsg);
    } finally {
      loginInFlight.current = false;
    }
  };
  const handleAutoFillTest = () => {
    const testEmail = import.meta.env.VITE_TEST_USER_EMAIL;
    const testPass = import.meta.env.VITE_TEST_USER_PASSWORD;
    setFormData({
      email: testEmail,
      password: testPass,
    });
    detectCompanyDomain(testEmail);
    setFormErrors({});
    setApiError('');
    toast.info('Test credentials loaded.');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (verifyInFlight.current || isLoading) return;
    setApiError('');
    if (!/^[0-9]{6}$/.test(otpValue)) {
      setApiError('Enter the six-digit verification code.');
      return;
    }
    verifyInFlight.current = true;
    try {
      await verifyOtp({ challenge_id: challengeId, otp: otpValue });
      toast.success('Successfully signed in.');
      navigate(fromRoute, { replace: true });
    } catch (err) {
      setApiError(err.message || 'The verification code is invalid or expired. Sign in again to retry.');
    } finally {
      verifyInFlight.current = false;
    }
  };
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading || resendInFlight.current) return;
    resendInFlight.current = true;
    setIsResending(true);
    setApiError('');
    try {
      const challenge = await resendOtp(challengeId);
      setChallengeId(challenge.challenge_id);
      setResendCountdown(challenge.resend_after_seconds || 60);
      setOtpValue('');
    } catch (err) {
      setApiError(err.message || 'Unable to resend the verification code. Try again shortly.');
    } finally {
      resendInFlight.current = false;
      setIsResending(false);
    }
  };
  const handleBackToPassword = () => {
    setChallengeId('');
    setOtpValue('');
    setApiError('');
    setResendCountdown(0);
  };

  if (challengeId) {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4.5 w-full" noValidate>
        <button type="button" onClick={handleBackToPassword} disabled={isLoading || isResending}
          className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] disabled:opacity-50">
          Back to sign in
        </button>
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">Verify your email</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            If the credentials are valid, a six-digit code was sent to the registered email address.
          </p>
        </div>
        {apiError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</p>}
        <label htmlFor="login-otp" className="block text-sm font-medium text-[#0F172A]">Verification code</label>
        <input
          id="login-otp"
          name="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={otpValue}
          onChange={(event) => setOtpValue(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          disabled={isLoading}
          required
          className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-center text-lg tracking-[0.4em] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:bg-slate-50"
        />
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isLoading} disabled={isLoading || otpValue.length !== 6}>
          Verify and sign in
        </Button>
        <button type="button" onClick={handleResendOtp} disabled={isLoading || isResending || resendCountdown > 0}
          className="w-full py-2 text-sm font-medium text-[#2563EB] disabled:text-slate-400">
          {isResending ? 'Sending code…' : resendCountdown > 0 ? 'Resend code in ' + resendCountdown + 's' : 'Resend verification code'}
        </button>
      </form>
    );
  }
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

        {canAutofillTest && (
          <div className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#64748B]">
            <span className="truncate">
              Development test account: <code className="text-[#0F172A] font-mono text-[11px]">{import.meta.env.VITE_TEST_USER_EMAIL}</code>
            </span>
            <button type="button" onClick={handleAutoFillTest}
              className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] shrink-0 ml-2 cursor-pointer">
              Auto-fill
            </button>
          </div>
        )}
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
