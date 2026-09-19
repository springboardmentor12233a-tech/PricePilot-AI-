import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import PasswordField from './PasswordField';
import { User, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export default function RegisterForm() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
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
      // Send ONLY the documented backend-supported fields: email, password, full_name
      const response = await register({
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.fullName.trim(),
      });

      // If backend returned access token directly, user is already authenticated
      if (response?.access_token) {
        toast.success('Account created and signed in.');
        navigate('/dashboard');
      } else {
        // Standard flow: redirect to /login
        toast.success('Account created successfully. Please sign in.');
        navigate('/login');
      }
    } catch (err) {
      const errorMsg =
        err.message || 'Unable to register. Please check your backend connection.';
      setApiError(errorMsg);
    }
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
        placeholder="Alex Morgan"
        value={formData.fullName}
        onChange={handleChange}
        error={formErrors.fullName}
        leftIcon={User}
        disabled={isLoading}
        required
      />

      {/* Email Address */}
      <Input
        label="Work Email Address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="alex@acme.com"
        value={formData.email}
        onChange={handleChange}
        error={formErrors.email}
        leftIcon={Mail}
        disabled={isLoading}
        required
      />

      {/* Password */}
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={formData.password}
        onChange={handleChange}
        error={formErrors.password}
        helperText="Must be at least 8 characters long."
        disabled={isLoading}
        required
      />

      {/* Confirm Password */}
      <PasswordField
        label="Confirm Password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Repeat your password"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={formErrors.confirmPassword}
        disabled={isLoading}
        required
      />

      {/* Primary Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full h-11 text-sm font-semibold"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </div>

      {/* Footer Navigation */}
      <div className="text-center pt-3 border-t border-[#F1F5F9]">
        <p className="text-xs text-[#64748B]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
