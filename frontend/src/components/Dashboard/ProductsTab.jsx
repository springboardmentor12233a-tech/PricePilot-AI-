import React, { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Sparkles, 
  ArrowUpDown, 
  TrendingDown, 
  TrendingUp, 
  Check, 
  X, 
  AlertCircle,
  Lock
} from "lucide-react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../../api";
import { INITIAL_SAMPLE_PRODUCTS } from "../../data/intelligenceData";
import { checkPermission } from "../../utils/rbac";
import AccessDeniedModal from "../AccessDeniedModal";

function ProductsTab({ user, products: propProducts, setProducts: propSetProducts }) {
  const [internalProducts, setInternalProducts] = useState(INITIAL_SAMPLE_PRODUCTS);
  const products = propProducts || internalProducts;
  const setProducts = propSetProducts || setInternalProducts;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // RBAC Access Denied Modal state
  const [accessDeniedState, setAccessDeniedState] = useState({
    isOpen: false,
    action: "",
    requiredRole: "ADMIN"
  });

  const [formData, setFormData] = useState({
    product_name: "",
    category: "Electronics",
    region: "Central",
    current_price: "",
    competitor_price: "",
    stock_availability: "",
  });

  const categories = ["All", "Electronics", "Fashion", "Grocery", "Home & Kitchen", "Beauty", "Sports", "Toys", "Books"];
  const regions = ["All", "Central", "East", "North", "South", "West"];

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProducts();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
      }
    } catch (err) {
      // Keep existing products
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    // RBAC Check
    if (!checkPermission(user?.role, "canAddProducts")) {
      setAccessDeniedState({
        isOpen: true,
        action: "Add New Product to Catalog",
        requiredRole: "ADMIN or PRICING_MANAGER"
      });
      return;
    }

    setModalMode("add");
    setEditingId(null);
    setFormData({
      product_name: "",
      category: "Electronics",
      region: "Central",
      current_price: "",
      competitor_price: "",
      stock_availability: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    // RBAC Check
    if (!checkPermission(user?.role, "canEditProducts")) {
      setAccessDeniedState({
        isOpen: true,
        action: `Edit Product Pricing (${p.product_name})`,
        requiredRole: "ADMIN or PRICING_MANAGER"
      });
      return;
    }

    setModalMode("edit");
    setEditingId(p.id);
    setFormData({
      product_name: p.product_name,
      category: p.category,
      region: p.region,
      current_price: p.current_price,
      competitor_price: p.competitor_price,
      stock_availability: p.stock_availability,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const payload = {
      product_name: formData.product_name,
      category: formData.category,
      region: formData.region,
      current_price: parseFloat(formData.current_price),
      competitor_price: parseFloat(formData.competitor_price),
      stock_availability: parseInt(formData.stock_availability, 10),
    };

    try {
      if (modalMode === "add") {
        try {
          const newProd = await createProduct(payload);
          setProducts([newProd, ...products]);
        } catch (apiErr) {
          const localItem = { id: Date.now(), ...payload };
          setProducts([localItem, ...products]);
        }
      } else {
        try {
          const updated = await updateProduct(editingId, payload);
          setProducts(products.map(p => p.id === editingId ? updated : p));
        } catch (apiErr) {
          setProducts(products.map(p => p.id === editingId ? { id: editingId, ...payload } : p));
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    // RBAC Check: Only Admin can delete
    if (!checkPermission(user?.role, "canDeleteProducts")) {
      setAccessDeniedState({
        isOpen: true,
        action: `Delete Product Entity (${name})`,
        requiredRole: "ADMIN (Highest Privilege)"
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from the database?`)) return;

    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchesReg = selectedRegion === "All" || p.region === selectedRegion;
    return matchesSearch && matchesCat && matchesReg;
  });

  return (
    <div>
      {/* Top Header Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Product Catalog Management</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Maintain pricing, track competitor differentials, and monitor stock availability with RBAC enforcement.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          Add New Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: "16px 20px", marginBottom: "20px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "220px", background: "rgba(0,0,0,0.25)", padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--border-light)" }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by product name or vertical..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: "13px", width: "100%", outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Category:</span>
          <select 
            className="form-select" 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Region:</span>
          <select 
            className="form-select" 
            value={selectedRegion} 
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }}
          >
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Product Details</th>
              <th>Category</th>
              <th>Region</th>
              <th>Our Price</th>
              <th>Competitor</th>
              <th>Market Delta</th>
              <th>Stock Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No products found matching the criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const diff = (p.current_price - p.competitor_price);
                const isCheaper = diff < 0;
                const isParity = Math.abs(diff) < 0.01;
                
                let stockClass = "stock-in";
                let stockLabel = `${p.stock_availability} in stock`;
                if (p.stock_availability <= 0) {
                  stockClass = "stock-out";
                  stockLabel = "Out of Stock";
                } else if (p.stock_availability < 50) {
                  stockClass = "stock-low";
                  stockLabel = `${p.stock_availability} low stock`;
                }

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{p.product_name}</div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>ID: #{p.id}</span>
                    </td>
                    <td>
                      <span className="tag-badge">{p.category}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{p.region}</span>
                    </td>
                    <td>
                      <strong style={{ fontSize: 15, color: "var(--accent-emerald)" }}>₹{Number(p.current_price).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span style={{ color: "var(--text-muted)" }}>₹{Number(p.competitor_price).toFixed(2)}</span>
                    </td>
                    <td>
                      <span className={`tag-badge ${isCheaper ? 'active' : ''}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {isCheaper ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                        {isParity ? "Parity" : `${isCheaper ? '-' : '+'}₹${Math.abs(diff).toFixed(2)}`}
                      </span>
                    </td>
                    <td>
                      <span className={`stock-tag ${stockClass}`}>{stockLabel}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Product"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDelete(p.id, p.product_name)}
                          title="Delete Product (Admin Only)"
                        >
                          <Trash2 size={14} />
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="auth-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
              <X size={18} />
            </button>

            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              {modalMode === "add" ? "Add Product to Portfolio" : "Update Product Pricing & Stock"}
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 20 }}>
              Changes trigger automated audit trail logging on the backend database.
            </p>

            {formError && (
              <div className="auth-alert-error" style={{ marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.product_name} 
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} 
                  placeholder="e.g. 4K Ultra HD Drone"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Region</label>
                  <select 
                    className="form-select"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  >
                    {regions.filter(r => r !== "All").map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Our Selling Price (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    className="form-input" 
                    value={formData.current_price} 
                    onChange={(e) => setFormData({ ...formData, current_price: e.target.value })} 
                    placeholder="49.99"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Competitor Price (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    className="form-input" 
                    value={formData.competitor_price} 
                    onChange={(e) => setFormData({ ...formData, competitor_price: e.target.value })} 
                    placeholder="54.00"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Available Stock Quantity</label>
                <input 
                  type="number" 
                  min="0" 
                  step="1" 
                  className="form-input" 
                  value={formData.stock_availability} 
                  onChange={(e) => setFormData({ ...formData, stock_availability: e.target.value })} 
                  placeholder="150"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }} 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={formLoading}
                >
                  {formLoading ? "Saving..." : modalMode === "add" ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Denied RBAC Warning Modal */}
      <AccessDeniedModal
        isOpen={accessDeniedState.isOpen}
        onClose={() => setAccessDeniedState({ ...accessDeniedState, isOpen: false })}
        actionName={accessDeniedState.action}
        userRole={user?.role}
        requiredRole={accessDeniedState.requiredRole}
      />
    </div>
  );
}

export default ProductsTab;
