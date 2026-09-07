"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, getCurrentUser } from "../lib/api";

interface Product {
  id: number;
  product_name: string;
  category: string;
  brand: string;
  base_price: number;
  current_price: number;
  inventory_level: number;
}

interface User {
  username: string;
  role: string;
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadData() {
      try {
        const userData = await getCurrentUser(token!);
        setUser(userData);

        const productData = await getProducts();
        setProducts(productData);
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="muted-text mono">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top Nav */}
      <div className="status-strip px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg logo-mark flex items-center justify-center font-bold text-[#052018] text-sm">
            P
          </div>
          <span className="font-semibold tracking-tight">PricePilot AI</span>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm muted-text">
              {user.username} · <span className="accent-text">{user.role}</span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm muted-text hover:text-white transition px-3 py-1.5 rounded-lg border border-[var(--border)]"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Product Catalog</h1>
          <p className="muted-text text-sm">
            {products.length} product{products.length !== 1 ? "s" : ""} in your pricing database
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <p className="muted-text">No products yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => (
              <div key={product.id} className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-base mb-1">
                      {product.product_name}
                    </h3>
                    <p className="text-xs muted-text-2">
                      {product.category} · {product.brand}
                    </p>
                  </div>
                  <span className="status-dot" />
                </div>

                <div className="terminal-card p-3.5 mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs muted-text">Current Price</span>
                    <span className="mono accent-text font-bold text-lg">
                      ${product.current_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="divider-fade my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs muted-text-2">Base Price</span>
                    <span className="mono text-xs muted-text-2">
                      ${product.base_price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="muted-text">Inventory</span>
                  <span className="mono violet-text font-medium">
                    {product.inventory_level} units
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}