import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/Card';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/authApi';

export default function SessionManagement() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const navigate = useNavigate();
  const { logout, logoutAll } = useAuth();

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await authApi.getSessions());
    } catch (error) {
      toastRef.current.error(error.message || 'Could not load sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const revoke = async (session) => {
    setBusyId(session.id);
    try {
      if (session.is_current) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }
      await authApi.revokeSession(session.id);
      toast.success('Session revoked.');
      await loadSessions();
    } catch (error) {
      toastRef.current.error(error.message || 'Could not revoke this session.');
    } finally {
      setBusyId('');
    }
  };

  const revokeEverywhere = async () => {
    setBusyId('all');
    try {
      await logoutAll();
      navigate('/login', { replace: true });
    } catch (error) {
      toastRef.current.error(error.message || 'Could not sign out other sessions.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <Card title="Signed-in devices" subtitle="Review session activity and sign out devices you no longer use.">
      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-500" role="status">Loading sessions…</p>}
        {!loading && sessions.length === 0 && <p className="text-sm text-slate-500">No sessions found.</p>}
        {sessions.map((session) => (
          <div key={session.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-slate-900">
                {session.is_current ? 'This device' : 'Other device'}{session.revoked_at ? ' · Revoked' : ''}
              </p>
              <p className="mt-1 break-words text-slate-600">{session.user_agent || 'Browser details unavailable'}</p>
              <p className="mt-1 text-xs text-slate-500">
                {[session.city, session.region, session.country].filter(Boolean).join(', ') || 'Approximate location unavailable'}
                {session.client_ip ? ' · ' + session.client_ip : ''}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Signed in {new Date(session.login_at).toLocaleString()} · Active {new Date(session.last_activity_at).toLocaleString()}
              </p>
            </div>
            {!session.revoked_at && (
              <button type="button" onClick={() => revoke(session)} disabled={Boolean(busyId)}
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                {busyId === session.id ? 'Signing out…' : session.is_current ? 'Sign out this device' : 'Revoke'}
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={revokeEverywhere} disabled={Boolean(busyId)}
          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
          {busyId === 'all' ? 'Signing out…' : 'Sign out all devices'}
        </button>
      </div>
    </Card>
  );
}