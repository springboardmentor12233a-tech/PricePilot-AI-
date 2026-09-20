import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log error in development
    if (import.meta.env.DEV) {
      console.error('PricePilot ErrorBoundary captured error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] p-6 sm:p-10 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
              Something went wrong
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
              We encountered an unexpected error while rendering this section. Your data is safe.
            </p>

            {/* Development-only error message (hidden in production) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-4 p-3 bg-[#F8FAFC] rounded-xl text-left border border-[#E2E8F0] overflow-x-auto text-[11px] font-mono text-[#DC2626]">
                <p className="font-semibold">{this.state.error.toString()}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-6">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs sm:text-sm font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F1F5F9] text-[#0F172A] text-xs sm:text-sm font-semibold hover:bg-[#E2E8F0] transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
