import { useEffect, useState } from "react";
import api from "../services/api";
import { DataTable, LoadingSpinner, ErrorState } from "../components/Common";

const ROLES = ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST", "VIEWER"];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/api/users")
      .then((r) => setUsers(r.data))
      .catch(() => setError("Could not load users."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const changeRole = async (id, role) => {
    await api.patch(`/api/users/${id}/role`, null, { params: { role } });
    load();
  };
  const toggleStatus = async (id, isActive) => {
    await api.patch(`/api/users/${id}/status`, null, { params: { is_active: !isActive } });
    load();
  };

  const columns = [
    { key: "full_name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (u) => (
      <select className="input !w-44 !py-1" value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
    ) },
    { key: "is_active", label: "Status", render: (u) => (
      <button className="btn-secondary text-xs" onClick={() => toggleStatus(u.id, u.is_active)}>
        {u.is_active ? "Active (click to disable)" : "Inactive (click to enable)"}
      </button>
    ) },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-semibold">User Management</h1>
      <div className="card p-4">
        <DataTable columns={columns} rows={users} keyField="id" />
      </div>
    </div>
  );
}
