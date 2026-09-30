'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { UserProfile, UserRole } from '@/lib/types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Briefcase,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  ShieldAlert,
  X,
  Lock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function UsersPage() {
  const { role, usersList, fetchUsers, addUser, updateUser, deleteUser, toggleUserStatus } = useAuth();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'BUSINESS_ANALYST' as UserRole,
    department: 'Pricing Strategy & Platform Ops',
    password: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchUsers();
      showToast('Users Directory Refreshed', 'Loaded latest user records from MongoDB.', 'info');
    } catch (err: any) {
      showToast('Fetch Error', err.message || 'Failed to refresh users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // If user is not Admin, display Access Restricted screen
  if (role !== 'ADMIN') {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }}>
        <div
          className="card"
          style={{
            padding: '44px 32px',
            borderColor: 'var(--pastel-rose-border)',
            backgroundColor: '#ffffff',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--pastel-rose)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}
          >
            <Lock size={26} color="var(--accent-rose)" />
          </div>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 700 }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            You do not have permission to access the User Management console. Role allocation and credential management are strictly restricted to <strong>ADMIN</strong> administrators.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn btn-primary">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && (u.status === 'ACTIVE' || u.is_active === true)) ||
      (statusFilter === 'INACTIVE' && (u.status === 'INACTIVE' || u.is_active === false));

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      role: 'BUSINESS_ANALYST',
      department: 'Merchandising & Pricing',
      password: '',
      status: 'ACTIVE',
    });
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || 'Store Merchandising',
      password: '',
      status: (user.status === 'INACTIVE' || user.is_active === false ? 'INACTIVE' : 'ACTIVE'),
    });
    setModalError(null);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setModalError('Name, email, and a temporary password are required.');
      return;
    }

    if (formData.password.length < 4) {
      setModalError('Password must contain at least 4 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const newUser = await addUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: formData.role,
        department: formData.department.trim(),
        is_active: formData.status === 'ACTIVE',
      });
      setIsAddModalOpen(false);
      showToast('User Created Successfully', `${newUser.name} added with ${newUser.role} role.`, 'success');
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setModalError(null);

    setSubmitting(true);
    try {
      const updates: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        department: formData.department.trim(),
        is_active: formData.status === 'ACTIVE',
        status: formData.status,
      };
      if (formData.password && formData.password.trim()) {
        updates.password = formData.password.trim();
      }

      const updated = await updateUser(editingUser.id, updates);
      setEditingUser(null);
      showToast('User Profile Updated', `${updated.name}'s account was successfully updated.`, 'success');
    } catch (err: any) {
      setModalError(err.message || 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUserId) return;
    setSubmitting(true);
    try {
      await deleteUser(deletingUserId);
      setDeletingUserId(null);
      showToast('User Removed', 'User account was deleted from MongoDB directory.', 'info');
    } catch (err: any) {
      showToast('Deletion Failed', err.message || 'Could not delete user.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    try {
      await toggleUserStatus(user.id);
      const newStatus = user.status === 'ACTIVE' || user.is_active === true ? 'Inactive' : 'Active';
      showToast('Status Updated', `${user.name} is now ${newStatus}.`, 'info');
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Could not update user status.', 'error');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">
              <Users size={28} color="var(--accent-purple)" />
              Enterprise User Management & Access Control
            </h1>
            <p className="page-subtitle">
              Manage live MongoDB user credentials, assign RBAC permissions (Admin, Business Analyst, User), and audit access status.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={handleRefresh} className="btn btn-secondary" disabled={loading} title="Refresh directory">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button onClick={handleOpenAdd} className="btn btn-primary" style={{ backgroundColor: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}>
              <UserPlus size={16} /> + Add User
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="control-bar">
        <div className="form-group" style={{ flex: '1 1 240px' }}>
          <label className="form-label">Search Users</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or department..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '36px' }}
            />
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        <div className="form-group" style={{ width: '180px' }}>
          <label className="form-label">Role Filter</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="BUSINESS_ANALYST">Business Analyst</option>
            <option value="USER">User</option>
          </select>
        </div>

        <div className="form-group" style={{ width: '160px' }}>
          <label className="form-label">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last Active</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  {loading ? 'Loading users from MongoDB...' : 'No users found matching current search criteria.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isActive = user.status === 'ACTIVE' || user.is_active === true;
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background:
                              user.role === 'ADMIN'
                                ? 'linear-gradient(135deg, #7C3AED, #6366F1)'
                                : user.role === 'BUSINESS_ANALYST'
                                ? 'linear-gradient(135deg, #0284C7, #06B6D4)'
                                : 'linear-gradient(135deg, #10B981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                          }}
                        >
                          {user.role === 'ADMIN' ? '👑' : user.role === 'BUSINESS_ANALYST' ? '📊' : '👤'}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td>
                      {user.role === 'ADMIN' && (
                        <span className="badge badge-purple">
                          <Shield size={12} /> Admin
                        </span>
                      )}
                      {user.role === 'BUSINESS_ANALYST' && (
                        <span className="badge badge-blue">
                          <Briefcase size={12} /> Business Analyst
                        </span>
                      )}
                      {user.role === 'USER' && (
                        <span className="badge badge-mint">
                          <UserIcon size={12} /> User
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{user.department || 'Store Merchandising'}</td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                        title="Click to toggle status"
                      >
                        {isActive ? (
                          <span className="badge badge-emerald">
                            <CheckCircle size={11} /> Active
                          </span>
                        ) : (
                          <span className="badge badge-gray">
                            <XCircle size={11} /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user.createdDate || '2024-08-01'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user.lastActive || 'Never'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                          title="Edit user"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingUserId(user.id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                          title="Delete user"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="card-header" style={{ padding: '16px 20px', margin: 0 }}>
              <div className="card-title">
                <UserPlus size={18} color="var(--accent-purple)" />
                Add New Enterprise User
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {modalError && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fecdd3',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={15} color="var(--accent-rose)" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. David Henderson"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. david.h@pricepilot.demo"
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setFormData({
                        ...formData,
                        role: newRole,
                        department:
                          newRole === 'ADMIN'
                            ? 'Pricing Strategy & Platform Ops'
                            : newRole === 'BUSINESS_ANALYST'
                            ? 'Merchandising & Pricing'
                            : 'Store Merchandising',
                      });
                    }}
                    className="form-select"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="BUSINESS_ANALYST">Business Analyst</option>
                    <option value="USER">User</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="form-select"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 4 characters"
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ backgroundColor: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}
                >
                  {submitting ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="card-header" style={{ padding: '16px 20px', margin: 0 }}>
              <div className="card-title">
                <Edit2 size={18} color="var(--accent-primary)" />
                Edit User: {editingUser.name}
              </div>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {modalError && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fecdd3',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={15} color="var(--accent-rose)" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="form-select"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="BUSINESS_ANALYST">Business Analyst</option>
                    <option value="USER">User</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="form-select"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reset Password (leave empty to keep unchanged)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password or leave blank"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingUserId && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--pastel-rose)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <ShieldAlert size={26} color="var(--accent-rose)" />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 700 }}>
                Delete this user?
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Are you sure you want to remove this user from MongoDB? This action is permanent and will invalidate their login credentials immediately.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button onClick={() => setDeletingUserId(null)} className="btn btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button onClick={handleConfirmDelete} className="btn btn-danger" disabled={submitting}>
                  {submitting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
