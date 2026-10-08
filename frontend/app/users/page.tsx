"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import { api } from "@/lib/api";
import { useAuth, UserRole } from "@/lib/auth-context";
import {
  UserCheck,
  UserPlus,
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("analyst");
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.auth.listUsers();
      setUsers(data);
    } catch (e: any) {
      console.error("Failed to load users:", e);
      setStatusMessage({ type: "error", text: "Failed to load user directory." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetUserId: number, targetEmail: string, updatedRole: UserRole) => {
    try {
      await api.auth.updateRole(targetUserId, updatedRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: updatedRole } : u))
      );
      setStatusMessage({
        type: "success",
        text: `Role for ${targetEmail} updated to ${updatedRole.toUpperCase()}.`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to update user role.";
      setStatusMessage({ type: "error", text: msg });
    }
  };

  const handleStatusToggle = async (targetUserId: number, targetEmail: string, currentActive: boolean) => {
    const newActive = !currentActive;
    try {
      await api.auth.updateStatus(targetUserId, newActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, is_active: newActive } : u))
      );
      setStatusMessage({
        type: "success",
        text: `Account ${targetEmail} has been ${newActive ? "activated" : "deactivated"}.`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to update user status.";
      setStatusMessage({ type: "error", text: msg });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    setCreatingUser(true);
    setStatusMessage(null);
    try {
      const created = await api.auth.registerUser({
        email: newEmail,
        password: newPassword,
        full_name: newFullName,
        role: newRole,
      });
      setUsers((prev) => [...prev, created]);
      setStatusMessage({
        type: "success",
        text: `New user ${created.email} registered successfully with role ${created.role.toUpperCase()}.`,
      });
      setIsModalOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewRole("analyst");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to create user account.";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-navy-950 flex flex-col">
        <Navbar />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    Admin Governance Only
                  </span>
                </div>
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight">
                  User Management & RBAC
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Manage enterprise team accounts, access roles, and permission levels
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-navy-950 shadow-md shadow-teal-500/15 transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register User</span>
                </button>
              </div>
            </div>

            {/* Notification alert */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                  statusMessage.type === "success"
                    ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
                <button onClick={() => setStatusMessage(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Users Table */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">User & Contact</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Role Permissions</th>
                      <th className="py-3 px-3">Change Role</th>
                      <th className="py-3 px-3 text-right">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => {
                      const isCurrent = currentUser?.id === u.id;
                      const isActive = u.is_active !== false;
                      return (
                        <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{u.full_name || u.name || "Enterprise User"}</span>
                              {isCurrent && (
                                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold">
                                  You (Admin)
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">{u.email}</div>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                                u.role === "admin"
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : u.role === "analyst"
                                  ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                                  : "bg-slate-800 text-slate-300 border-slate-700"
                              }`}
                            >
                              {u.role === "analyst" ? "Business Analyst" : u.role}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                isActive
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : "bg-red-500/15 text-red-400 border-red-500/30"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                                }`}
                              />
                              {isActive ? "Active" : "Deactivated"}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-slate-400 text-[11px]">
                            {u.role === "admin" && "Full administrative control, user governance, models"}
                            {u.role === "analyst" && "Price predictions, forecasts, BI report exports"}
                            {u.role === "viewer" && "Read-only dashboard access"}
                          </td>

                          <td className="py-3 px-3">
                            <select
                              value={u.role}
                              disabled={isCurrent}
                              onChange={(e) => handleRoleChange(u.id, u.email, e.target.value as UserRole)}
                              title={isCurrent ? "Cannot demote your own Admin role" : "Change user role"}
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500/80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <option value="admin">Admin</option>
                              <option value="analyst">Business Analyst</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </td>

                          <td className="py-3 px-3 text-right">
                            {isCurrent ? (
                              <span className="text-[10px] text-slate-500 italic">Self (Protected)</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStatusToggle(u.id, u.email, isActive)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                                  isActive
                                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                }`}
                              >
                                {isActive ? "Deactivate" : "Activate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Register User Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
                <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl relative text-slate-100">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="font-serif font-bold text-lg text-white mb-1">
                    Register Enterprise User
                  </h3>
                  <p className="text-xs text-slate-400 mb-5">
                    Create new credentials and assign initial RBAC authorization
                  </p>

                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="e.g. Dr. Jordan Vance"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="jordan@pricepilot.ai"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Initial Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Initial Role</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="analyst">Business Analyst (Can view & export BI reports)</option>
                        <option value="viewer">Viewer (Read-only dashboard)</option>
                        <option value="admin">Admin (Full system access & governance)</option>
                      </select>
                    </div>

                    <div className="flex gap-2 justify-end pt-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creatingUser}
                        className="px-5 py-2 rounded-xl text-xs font-semibold text-navy-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50"
                      >
                        {creatingUser ? "Registering..." : "Create Account"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>

        <ChatWidget />
      </div>
    </AuthGuard>
  );
}
