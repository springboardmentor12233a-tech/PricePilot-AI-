"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser, getAllUsers, updateUserRole, toggleUserActive,
  getHealth, createUserAsAdmin, deleteUser,
  getProducts, createProduct, updateProduct, deleteProduct,
  getRestockRequests, updateRestockStatus,
} from "../lib/api";

interface UserRow {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface ProductRow {
  id: number;
  product_name: string;
  category: string;
  brand: string;
  base_price: number;
  current_price: number;
  inventory_level: number;
}

const ROLES = ["Admin", "Business Analyst", "User"];

const ROLE_BADGE: Record<string, string> = {
  Admin: "bg-red-500/15 text-red-400 border-red-500/30",
  "Business Analyst": "bg-violet-500/15 text-violet-300 border-violet-500/30",
  User: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const emptyProduct = {
  product_name: "", category: "", brand: "", base_price: 0, current_price: 0, inventory_level: 0,
};

export default function AdminPage() {
  const [tab, setTab] = useState<"diagnostics" | "products" | "users" | "restock">("diagnostics");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [restocks, setRestocks] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // New user form
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "User" });

  // Product form
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [productForm, setProductForm] = useState(emptyProduct);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const me = await getCurrentUser(token!);
      if (me.role !== "Admin") {
        router.push("/dashboard");
        return;
      }
      setCurrentUser(me);
      const [userList, productList, healthData, restockList] = await Promise.all([
        getAllUsers(token!),
        getProducts(),
        getHealth(),
        getRestockRequests(token!),
      ]);
      setUsers(userList);
      setProducts(productList);
      setHealth(healthData);
      setRestocks(restockList);
    } catch (err) {
      setError("Failed to load admin data. Admin access required.");
    } finally {
      setLoading(false);
    }
  }

  // --- User actions ---
  async function handleRoleChange(userId: number, newRole: string) {
    try {
      await updateUserRole(userId, newRole, token!);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch {
      setError("Failed to update role");
    }
  }

  async function handleToggleActive(userId: number, currentStatus: boolean) {
    try {
      await toggleUserActive(userId, !currentStatus, token!);
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u)));
    } catch {
      setError("Failed to update status");
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await createUserAsAdmin(newUser, token!);
      setUsers([...users, created]);
      setShowNewUser(false);
      setNewUser({ username: "", email: "", password: "", role: "User" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await deleteUser(userId, token!);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  // --- Product actions ---
  function startEditProduct(p: ProductRow) {
    setEditingProduct(p.id);
    setShowNewProduct(false);
    setProductForm({
      product_name: p.product_name, category: p.category, brand: p.brand,
      base_price: p.base_price, current_price: p.current_price, inventory_level: p.inventory_level,
    });
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct, productForm, token!);
        setProducts(products.map((p) => (p.id === editingProduct ? updated : p)));
        setEditingProduct(null);
      } else {
        const created = await createProduct(productForm, token!);
        setProducts([...products, created]);
        setShowNewProduct(false);
      }
      setProductForm(emptyProduct);
    } catch {
      setError("Failed to save product");
    }
  }

  async function handleDeleteProduct(productId: number) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await deleteProduct(productId, token!);
      setProducts(products.filter((p) => p.id !== productId));
    } catch {
      setError("Failed to delete product");
    }
  }

  async function handleRestockStatus(requestId: number, status: "approved" | "rejected") {
    try {
      await updateRestockStatus(requestId, status, token!);
      const [updatedRequests, updatedProducts] = await Promise.all([
        getRestockRequests(token!),
        getProducts(),
      ]);
      setRestocks(updatedRequests);
      setProducts(updatedProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update request");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="muted-text mono">Loading admin console...</p>
      </div>
    );
  }

  const roleCounts = ROLES.map((r) => ({ role: r, count: users.filter((u) => u.role === r).length }));
  const activeCount = users.filter((u) => u.is_active).length;

  return (
    <div className="min-h-screen">
      <div className="status-strip px-8 py-4 flex items-center justify-between">
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 tracking-wide">
          🔒 RESTRICTED: ADMIN ROLE ONLY
        </span>
        <span className="text-sm muted-text">
          {currentUser?.username} · <span className="accent-text">Admin</span>
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Admin Governance Console</h1>
          <p className="muted-text text-sm">System diagnostics, product catalog & user management</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError("")} className="text-xs underline">dismiss</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
          {[
            { key: "diagnostics", label: "System Diagnostics" },
            { key: "products", label: "Product Catalog CRUD" },
            { key: "users", label: "User Accounts CRUD" },
            { key: "restock", label: "Restock Requests" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                tab === t.key
                  ? "border-[var(--accent)] accent-text"
                  : "border-transparent muted-text hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: System Diagnostics */}
        {tab === "diagnostics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5">
                <p className="text-xs muted-text mb-2 uppercase tracking-wide">System Status</p>
                <p className="mono font-bold text-lg flex items-center gap-2">
                  <span className="status-dot" /> {health?.status === "online" ? "Online" : "Degraded"}
                </p>
              </div>
              <div className="glass-card p-5">
                <p className="text-xs muted-text mb-2 uppercase tracking-wide">Database</p>
                <p className={`mono font-bold text-lg ${health?.database === "connected" ? "accent-text" : "text-red-400"}`}>
                  {health?.database === "connected" ? "Connected" : "Disconnected"}
                </p>
              </div>
              <div className="glass-card p-5">
                <p className="text-xs muted-text mb-2 uppercase tracking-wide">API Version</p>
                <p className="mono violet-text font-bold text-lg">v{health?.version}</p>
              </div>
              <div className="glass-card p-5">
                <p className="text-xs muted-text mb-2 uppercase tracking-wide">Total Users</p>
                <p className="mono font-bold text-2xl">{users.length}</p>
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Users by Role</h2>
              <div className="flex gap-4">
                {roleCounts.map((rc) => (
                  <div key={rc.role} className="terminal-card px-4 py-3 flex-1">
                    <p className="text-xs muted-text mb-1">{rc.role}</p>
                    <p className="mono font-bold text-xl">{rc.count}</p>
                  </div>
                ))}
                <div className="terminal-card px-4 py-3 flex-1">
                  <p className="text-xs muted-text mb-1">Active</p>
                  <p className="mono accent-text font-bold text-xl">{activeCount}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-2">Product Catalog</h2>
              <p className="text-sm muted-text">{products.length} products tracked in the database</p>
            </div>
          </div>
        )}

        {/* TAB: Product Catalog CRUD */}
        {tab === "products" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setShowNewProduct(!showNewProduct);
                  setEditingProduct(null);
                  setProductForm(emptyProduct);
                }}
                className="accent-btn text-xs px-4 py-2 rounded-lg font-semibold"
              >
                {showNewProduct ? "Cancel" : "+ Add New Product"}
              </button>
            </div>

            {(showNewProduct || editingProduct) && (
              <form onSubmit={handleSaveProduct} className="glass-card p-6 mb-6 grid grid-cols-2 gap-4">
                <input required placeholder="Product name" value={productForm.product_name}
                  onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                  className="input-field px-3 py-2 rounded-lg text-sm text-white" />
                <input required placeholder="Category" value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="input-field px-3 py-2 rounded-lg text-sm text-white" />
                <input required placeholder="Brand" value={productForm.brand}
                  onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                  className="input-field px-3 py-2 rounded-lg text-sm text-white" />
                <input required type="number" step="0.01" placeholder="Base price" value={productForm.base_price}
                  onChange={(e) => setProductForm({ ...productForm, base_price: parseFloat(e.target.value) })}
                  className="input-field px-3 py-2 rounded-lg text-sm text-white" />
                <input required type="number" step="0.01" placeholder="Current price" value={productForm.current_price}
                  onChange={(e) => setProductForm({ ...productForm, current_price: parseFloat(e.target.value) })}
                  className="input-field px-3 py-2 rounded-lg text-sm text-white" />
                <input required type="number" placeholder="Inventory level" value={productForm.inventory_level}
                  onChange={(e) => setProductForm({ ...productForm, inventory_level: parseInt(e.target.value) })}
                  className="input-field px-3 py-2 rounded-lg text-sm text-white" />
                <button type="submit" className="accent-btn col-span-2 py-2.5 rounded-lg text-sm font-semibold">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </form>
            )}

            <div className="glass-card p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left muted-text text-xs uppercase border-b border-[var(--border)]">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Inventory</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border)]">
                      <td className="py-3 font-medium">{p.product_name}</td>
                      <td className="py-3 muted-text text-xs">{p.category} · {p.brand}</td>
                      <td className="py-3 mono accent-text">${p.current_price.toFixed(2)}</td>
                      <td className="py-3 mono">{p.inventory_level}</td>
                      <td className="py-3 flex gap-2">
                        <button onClick={() => startEditProduct(p)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] muted-text hover:text-white transition">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Restock Requests */}
        {tab === "restock" && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Restock Requests</h2>
            {restocks.length === 0 ? (
              <p className="muted-text text-sm">No restock requests yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left muted-text text-xs uppercase border-b border-[var(--border)]">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Requested By</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {restocks.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border)]">
                      <td className="py-3 mono muted-text-2 text-xs">{r.id}</td>
                      <td className="py-3 font-medium">{r.product_name}</td>
                      <td className="py-3 muted-text text-xs">{r.requested_by}</td>
                      <td className="py-3 mono">{r.quantity}</td>
                      <td className="py-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border ${
                            r.status === "approved"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : r.status === "rejected"
                              ? "bg-red-500/15 text-red-400 border-red-500/30"
                              : "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 mono text-xs muted-text-2">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3">
                        {r.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRestockStatus(r.id, "approved")}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRestockStatus(r.id, "rejected")}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="muted-text-2 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB: User Accounts CRUD */}
        {tab === "users" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowNewUser(!showNewUser)}
                className="accent-btn text-xs px-4 py-2 rounded-lg font-semibold"
              >
                {showNewUser ? "Cancel" : "+ Add New User"}
              </button>
            </div>

            {showNewUser && (
              <form onSubmit={handleCreateUser} className="glass-card p-6 mb-6 grid grid-cols-2 gap-4">
                <input required placeholder="Username" value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="input-field px-3 py-2 rounded-lg text-sm text-white" />
                <input required type="email" placeholder="Email" value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-field px-3 py-2 rounded-lg text-sm text-white" />
                <input required type="password" placeholder="Password" value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input-field px-3 py-2 rounded-lg text-sm text-white" />
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="input-field px-3 py-2 rounded-lg text-sm text-white bg-transparent">
                  {ROLES.map((r) => <option key={r} value={r} className="bg-[#0d0f14]">{r}</option>)}
                </select>
                <button type="submit" className="accent-btn col-span-2 py-2.5 rounded-lg text-sm font-semibold">
                  Create User
                </button>
              </form>
            )}

            <div className="glass-card p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left muted-text text-xs uppercase border-b border-[var(--border)]">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Username</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[var(--border)]">
                      <td className="py-3 mono muted-text-2 text-xs">{u.id}</td>
                      <td className="py-3 font-medium">{u.username}</td>
                      <td className="py-3 muted-text text-xs">{u.email}</td>
                      <td className="py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border bg-transparent ${ROLE_BADGE[u.role]}`}
                        >
                          {ROLES.map((r) => <option key={r} value={r} className="bg-[#0d0f14] text-white">{r}</option>)}
                        </select>
                      </td>
                      <td className="py-3 mono text-xs muted-text-2">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span className={u.is_active ? "accent-text text-xs" : "text-red-400 text-xs"}>
                          {u.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="py-3 flex gap-2">
                        <button onClick={() => handleToggleActive(u.id, u.is_active)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] muted-text hover:text-white transition">
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}