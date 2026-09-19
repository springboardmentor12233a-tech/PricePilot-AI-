import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your PricePilot AI account to access real-time pricing intelligence."
      badgeText="Enterprise Pricing Engine"
    >
      <LoginForm />
    </AuthLayout>
  );
}
