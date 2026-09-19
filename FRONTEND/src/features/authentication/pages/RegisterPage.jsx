import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import RegisterForm from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start optimizing your pricing with PricePilot AI."
      badgeText="Dynamic Pricing Optimization"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
