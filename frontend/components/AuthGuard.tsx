"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/lib/auth-context";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-slate-300">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-amber-500/20 border-b-amber-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
        <p className="font-mono text-sm tracking-wider text-teal-400">AUTHENTICATING PRICEPILOT SESSION...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
        <div className="glass-card max-w-lg w-full p-8 rounded-2xl border border-red-500/30 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-red-400">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your current role is <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold uppercase">{user.role}</span>.
            This area requires one of the following privilege levels:{" "}
            <span className="font-mono text-teal-400 font-medium">
              {allowedRoles.map((r) => r.toUpperCase()).join(", ")}
            </span>.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold text-sm transition-all shadow-lg shadow-teal-500/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
