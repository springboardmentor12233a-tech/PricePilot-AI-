import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import InventoryTable from '../components/InventoryTable';
import InventoryCard from '../components/InventoryCard';
import InventoryUpdateModal from '../components/InventoryUpdateModal';
import EmptyState from '../../../components/EmptyState';
import { useProducts } from '../../products/hooks/useProducts';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { inventoryApi } from '../services/inventoryApi';
import { deriveInventoryStatus } from '../utils/inventoryHelpers';
import { useToast } from '../../../hooks/useToast';
import {
  Boxes,
  RefreshCw,
  AlertCircle,
  Search,
  Layers,
  Plus,
  Package,
  CheckCircle2,
  AlertTriangle,
  PackageX,
  X,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Scoped animation styles ("ip-" prefix)                                     */
/* -------------------------------------------------------------------------- */
const INVENTORY_CSS = `
.ip-page { position: relative; isolation: isolate; }

.ip-ambient {
  position: absolute; inset: -24px -16px auto -16px; height: 480px; z-index: -1; pointer-events: none;
  background:
    radial-gradient(ellipse 45% 55% at 8% 0%, rgba(147,197,253,.36), transparent 70%),
    radial-gradient(ellipse 40% 50% at 92% 6%, rgba(110,231,183,.26), transparent 70%);
  -webkit-mask-image: linear-gradient(#000 40%, transparent);
  mask-image: linear-gradient(#000 40%, transparent);
  animation: ip-ambient 14s ease-in-out infinite alternate;
}
@keyframes ip-ambient { from { opacity: .75; transform: translateY(0); } to { opacity: 1; transform: translateY(14px); } }

/* Reveal */
.ip-reveal { opacity: 0; transform: translateY(20px); transition: opacity .6s ease, transform .6s cubic-bezier(.2,.8,.2,1); }
.ip-reveal.is-visible { opacity: 1; transform: none; }

/* Stat cards */
.ip-stat {
  position: relative; overflow: hidden;
  transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease, border-color .3s ease;
}
.ip-stat::after {
  content: ''; position: absolute; right: -28px; top: -28px; width: 96px; height: 96px; border-radius: 9999px;
  background: var(--ip-accent, #3b82f6); opacity: .1; transition: transform .4s ease, opacity .3s ease;
}
.ip-stat:hover { transform: translateY(-4px); box-shadow: 0 18px 32px -18px var(--ip-accent, #3b82f6); border-color: var(--ip-accent, #3b82f6); }
.ip-stat:hover::after { transform: scale(1.5); opacity: .16; }
.ip-stat-icon { transition: transform .35s cubic-bezier(.2,.8,.2,1); }
.ip-stat:hover .ip-stat-icon { transform: scale(1.12) rotate(-6deg); }

/* Stock health distribution bar */
.ip-health-seg { height: 100%; transition: width 1.2s cubic-bezier(.2,.8,.2,1); position: relative; overflow: hidden; }
.ip-health-seg::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
  transform: translateX(-100%); animation: ip-shine 3.4s ease-in-out infinite;
}
@keyframes ip-shine { 60%,100% { transform: translateX(100%); } }

/* Filter bar */
.ip-bar { transition: box-shadow .3s ease; }
.ip-bar:focus-within { box-shadow: 0 16px 36px -22px rgba(37,99,235,.45); }
.ip-search { transition: box-shadow .25s ease, border-color .25s ease; }
.ip-chip {
  display: inline-flex; align-items: center; gap: .4rem; white-space: nowrap;
  padding: .45rem .8rem; border-radius: 9999px; font-size: .75rem; font-weight: 600;
  border: 1px solid #E2E8F0; background: #fff; color: #475569; cursor: pointer;
  transition: transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease, background-color .2s ease, color .2s ease, border-color .2s ease;
}
.ip-chip:hover { transform: translateY(-2px); border-color: #93c5fd; color: #1d4ed8; }
.ip-chip:active { transform: scale(.96); }
.ip-chip:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }
.ip-chip.is-active { color: #fff; border-color: transparent; background: var(--ip-chip, #2563eb); box-shadow: 0 8px 18px -8px var(--ip-chip, #2563eb); }
.ip-chip-count { font-size: .65rem; padding: .05rem .4rem; border-radius: 9999px; background: rgba(100,116,139,.12); }
.ip-chip.is-active .ip-chip-count { background: rgba(255,255,255,.25); }

/* Skeleton shimmer */
.ip-skel { position: relative; overflow: hidden; background: #EEF2F7; }
.ip-skel::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent);
  transform: translateX(-100%); animation: ip-shimmer 1.4s infinite;
}
@keyframes ip-shimmer { to { transform: translateX(100%); } }

/* Misc */
.ip-float { animation: ip-float 4s ease-in-out infinite; }
@keyframes ip-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.ip-pop { animation: ip-pop .5s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ip-pop { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
.ip-card-in { opacity: 0; animation: ip-pop .5s cubic-bezier(.2,.8,.2,1) forwards; }
.ip-no-scrollbar::-webkit-scrollbar { display: none; }
.ip-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

@media (prefers-reduced-motion: reduce) {
  .ip-ambient, .ip-health-seg::after, .ip-skel::after, .ip-float, .ip-pop, .ip-card-in { animation: none !important; }
  .ip-card-in { opacity: 1; }
  .ip-reveal { opacity: 1; transform: none; transition: none; }
  .ip-stat, .ip-chip, .ip-health-seg { transition: none; }
}
`;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`ip-reveal ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* Animates smoothly from the previously shown number to the new one */
function CountUp({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(value);
      fromRef.current = value;
      return undefined;
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (value - from) * eased;
      setDisplay(current);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{Math.round(display).toLocaleString()}</>;
}

const STATUS_CHIPS = [
  { id: 'all', label: 'All', color: '#2563eb' },
  { id: 'healthy', label: 'Healthy', color: '#059669' },
  { id: 'low_stock', label: 'Low Stock', color: '#d97706' },
  { id: 'out_of_stock', label: 'Out of Stock', color: '#e11d48' },
  { id: 'unavailable', label: 'Unavailable', color: '#64748b' },
];

export default function InventoryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedOrganizationId } = useOrganization();

  // Load organization products first
  const {
    products,
    isLoading: isLoadingProducts,
    error: productsError,
    refresh: refreshProducts,
  } = useProducts(selectedOrganizationId);

  // Map of productId -> { inventory, isLoading, error }
  const [inventoryMap, setInventoryMap] = useState({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal for updating stock
  const [selectedProductForUpdate, setSelectedProductForUpdate] = useState(null);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Controlled batch loading of inventories
  const loadInventoriesForProducts = useCallback(async (productList) => {
    if (!productList || productList.length === 0) return;

    // Batch in chunks of 4 to avoid overwhelming connection pools
    const batchSize = 4;
    for (let i = 0; i < productList.length; i += batchSize) {
      const batch = productList.slice(i, i + batchSize);

      // Set batch as loading
      setInventoryMap((prev) => {
        const next = { ...prev };
        batch.forEach((p) => {
          if (!next[p.id]) {
            next[p.id] = { inventory: null, isLoading: true, error: null };
          }
        });
        return next;
      });

      // Execute batch concurrently
      await Promise.all(
        batch.map(async (product) => {
          try {
            const data = await inventoryApi.getProductInventory(product.id);
            setInventoryMap((prev) => ({
              ...prev,
              [product.id]: { inventory: data, isLoading: false, error: null },
            }));
          } catch (err) {
            setInventoryMap((prev) => ({
              ...prev,
              [product.id]: {
                inventory: null,
                isLoading: false,
                error: err?.response?.status === 404 ? 'No record' : 'Failed',
              },
            }));
          }
        })
      );
    }
  }, []);

  // When products change or refresh is requested, load their inventory positions
  useEffect(() => {
    if (products && products.length > 0) {
      loadInventoriesForProducts(products);
    } else {
      setInventoryMap({});
    }
  }, [products, loadInventoriesForProducts]);

  const handleRefreshAll = () => {
    setInventoryMap({});
    refreshProducts();
  };

  const handleUpdateStockSubmit = async (payload) => {
    if (!selectedProductForUpdate) return;
    setIsUpdatingStock(true);
    try {
      const updated = await inventoryApi.updateProductInventory(
        selectedProductForUpdate.id,
        payload
      );
      setInventoryMap((prev) => ({
        ...prev,
        [selectedProductForUpdate.id]: {
          inventory: updated,
          isLoading: false,
          error: null,
        },
      }));
      setSelectedProductForUpdate(null);
    } catch (err) {
      throw err;
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // Build combined items for rendering
  const inventoryItems = useMemo(() => {
    return products.map((product) => {
      const state = inventoryMap[product.id] || {
        inventory: null,
        isLoading: isLoadingProducts,
        error: null,
      };
      return {
        product,
        inventory: state.inventory,
        isLoading: state.isLoading,
        error: state.error,
        statusInfo: deriveInventoryStatus(state.inventory),
      };
    });
  }, [products, inventoryMap, isLoadingProducts]);

  // Filter items by search & status
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventoryItems.filter(({ product, statusInfo }) => {
      if (filterStatus !== 'all') {
        if (statusInfo.status !== filterStatus) return false;
      }
      if (q) {
        const name = (product.name || '').toLowerCase();
        const sku = (product.sku || '').toLowerCase();
        return name.includes(q) || sku.includes(q);
      }
      return true;
    });
  }, [inventoryItems, search, filterStatus]);

  // Per-status counts for the filter chips
  const statusCounts = useMemo(() => {
    const counts = { all: inventoryItems.length, healthy: 0, low_stock: 0, out_of_stock: 0, unavailable: 0 };
    inventoryItems.forEach(({ statusInfo }) => {
      if (counts[statusInfo.status] !== undefined) counts[statusInfo.status] += 1;
    });
    return counts;
  }, [inventoryItems]);

  // Derive real statistics from currently loaded inventories (never fabricated)
  const stats = useMemo(() => {
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let healthyCount = 0;
    let totalOnHand = 0;
    let hasLoadedAny = false;

    Object.values(inventoryMap).forEach((item) => {
      if (item.inventory) {
        hasLoadedAny = true;
        const status = deriveInventoryStatus(item.inventory).status;
        if (status === 'low_stock') lowStockCount++;
        if (status === 'out_of_stock') outOfStockCount++;
        if (status === 'healthy') healthyCount++;
        if (item.inventory.quantity_on_hand !== undefined && item.inventory.quantity_on_hand !== null) {
          totalOnHand += Number(item.inventory.quantity_on_hand) || 0;
        }
      }
    });

    return {
      hasLoadedAny,
      totalOnHand,
      lowStockCount,
      outOfStockCount,
      healthyCount,
    };
  }, [inventoryMap]);

  // Segments for the stock-health bar (only real, loaded counts)
  const healthTotal = stats.healthyCount + stats.lowStockCount + stats.outOfStockCount;
  const healthSegments = [
    { key: 'healthy', label: 'Healthy', count: stats.healthyCount, bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400', dot: 'bg-emerald-500' },
    { key: 'low', label: 'Low stock', count: stats.lowStockCount, bar: 'bg-gradient-to-r from-amber-500 to-amber-400', dot: 'bg-amber-500' },
    { key: 'out', label: 'Out of stock', count: stats.outOfStockCount, bar: 'bg-gradient-to-r from-rose-500 to-rose-400', dot: 'bg-rose-500' },
  ];

  // Animate the bar from zero on first appearance
  const [barsReady, setBarsReady] = useState(false);
  useEffect(() => {
    if (!stats.hasLoadedAny) return undefined;
    const t = setTimeout(() => setBarsReady(true), 200);
    return () => clearTimeout(t);
  }, [stats.hasLoadedAny]);

  if (!selectedOrganizationId) {
    return (
      <div className="ip-page space-y-6">
        <style>{INVENTORY_CSS}</style>
        <div aria-hidden className="ip-ambient" />
        <PageHeader
          title="Inventory"
          description="Monitor stock levels and inventory health."
        />
        <div className="ip-pop">
          <EmptyState
            icon={Layers}
            title="No Organization Selected"
            description="Select an active organization workspace to view inventory records."
            actionText="Go to Organizations"
            onAction={() => navigate('/organization')}
          />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Stock Units', value: stats.totalOnHand, icon: Package, accent: '#3b82f6', tile: 'from-blue-500 to-indigo-500', text: 'text-[#0F172A]' },
    { label: 'Healthy Items', value: stats.healthyCount, icon: CheckCircle2, accent: '#10b981', tile: 'from-emerald-500 to-teal-500', text: 'text-emerald-600' },
    { label: 'Low Stock Alerts', value: stats.lowStockCount, icon: AlertTriangle, accent: '#f59e0b', tile: 'from-amber-500 to-orange-500', text: 'text-amber-600' },
    { label: 'Out of Stock', value: stats.outOfStockCount, icon: PackageX, accent: '#f43f5e', tile: 'from-rose-500 to-pink-500', text: 'text-rose-600' },
  ];

  return (
    <div className="ip-page space-y-6">
      <style>{INVENTORY_CSS}</style>
      <div aria-hidden className="ip-ambient" />

      <Reveal>
        <PageHeader
          title="Inventory"
          description="Monitor stock levels and inventory health."
          actions={
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="md"
                leftIcon={RefreshCw}
                onClick={handleRefreshAll}
                disabled={isLoadingProducts}
                className={isLoadingProducts ? 'animate-spin' : ''}
                title="Refresh inventory"
              >
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={Plus}
                onClick={() => navigate('/products')}
              >
                Manage Products
              </Button>
            </div>
          }
        />
      </Reveal>

      {/* Real Inventory Metrics (Shown only from loaded real data) */}
      {stats.hasLoadedAny && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.label} delay={i * 80}>
                  <div
                    className="ip-stat p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs h-full"
                    style={{ '--ip-accent': s.accent }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-[#64748B] font-medium">{s.label}</span>
                      <span className={`ip-stat-icon w-8 h-8 rounded-lg bg-gradient-to-br ${s.tile} text-white flex items-center justify-center shadow-md`}>
                        <Icon className="w-4 h-4" />
                      </span>
                    </div>
                    <span className={`relative text-2xl font-extrabold font-mono mt-2 block ${s.text}`}>
                      <CountUp value={s.value} />
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Stock health distribution */}
          {healthTotal > 0 && (
            <Reveal delay={200}>
              <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Stock Health</span>
                  <span className="text-[11px] text-[#64748B]">{healthTotal} items with inventory records</span>
                </div>
                <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-[#F1F5F9] gap-0.5">
                  {healthSegments.map((seg) =>
                    seg.count > 0 ? (
                      <div
                        key={seg.key}
                        className={`ip-health-seg ${seg.bar}`}
                        style={{ width: barsReady ? `${(seg.count / healthTotal) * 100}%` : '0%' }}
                        title={`${seg.label}: ${seg.count}`}
                      />
                    ) : null
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-[11px] text-[#64748B]">
                  {healthSegments.map((seg) => (
                    <span key={seg.key} className="inline-flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${seg.dot}`} />
                      {seg.label}
                      <strong className="text-[#0F172A]">{seg.count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      )}

      {productsError && (
        <div className="ip-pop p-4 rounded-2xl bg-red-50/70 border border-red-200 text-sm text-red-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-[#DC2626]" />
            </span>
            <span>{productsError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={handleRefreshAll}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Reveal delay={100}>
        <div className="ip-bar bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs space-y-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory by product or SKU..."
              className="ip-search w-full h-10.5 pl-9 pr-10 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div
            className="flex items-center gap-2 overflow-x-auto ip-no-scrollbar pb-0.5"
            role="group"
            aria-label="Filter inventory by health status"
          >
            {STATUS_CHIPS.map((chip) => {
              const active = filterStatus === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilterStatus(chip.id)}
                  aria-pressed={active}
                  className={`ip-chip ${active ? 'is-active' : ''}`}
                  style={{ '--ip-chip': chip.color }}
                >
                  {chip.label}
                  <span className="ip-chip-count">{statusCounts[chip.id] ?? 0}</span>
                </button>
              );
            })}
            <span className="ml-auto pl-3 text-[11px] text-[#94A3B8] whitespace-nowrap hidden sm:block">
              Showing {filteredItems.length} of {inventoryItems.length}
            </span>
          </div>
        </div>
      </Reveal>

      {isLoadingProducts && products.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 space-y-4">
          <div className="ip-skel h-6 w-48 rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="ip-skel h-12 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="ip-pop">
          <EmptyState
            icon={Boxes}
            title="No products in catalog"
            description="Add products to your catalog to start tracking warehouse inventory and stock velocity."
            actionText="Add Product"
            onAction={() => navigate('/products')}
            actionIcon={Plus}
          />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="ip-pop rounded-2xl border border-dashed border-[#CBD5E1] bg-gradient-to-b from-white to-slate-50 p-12 text-center">
          <div className="ip-float w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-[#2563EB] flex items-center justify-center shadow-md shadow-blue-500/10">
            <Boxes className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-[#0F172A]">No matching inventory items</h3>
          <p className="text-xs text-[#64748B] mt-1 mb-4">
            Try adjusting your search keyword or status filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setFilterStatus('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <Reveal className="hidden md:block" delay={120}>
            <InventoryTable
              items={filteredItems}
              onUpdateStock={(product, inv) => setSelectedProductForUpdate(product)}
              onViewProduct={(id) => navigate(`/products/${id}`)}
            />
          </Reveal>

          {/* Mobile Card Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
            {filteredItems.map(({ product, inventory, isLoading }, idx) => (
              <div
                key={product.id}
                className="ip-card-in"
                style={{ animationDelay: `${Math.min(idx, 8) * 60}ms` }}
              >
                <InventoryCard
                  product={product}
                  inventory={inventory}
                  isLoading={isLoading}
                  onUpdateStock={(prod) => setSelectedProductForUpdate(prod)}
                  onViewProduct={(id) => navigate(`/products/${id}`)}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Stock Update Modal */}
      {selectedProductForUpdate && (
        <InventoryUpdateModal
          isOpen={Boolean(selectedProductForUpdate)}
          onClose={() => setSelectedProductForUpdate(null)}
          onSubmit={handleUpdateStockSubmit}
          currentInventory={inventoryMap[selectedProductForUpdate.id]?.inventory}
          productName={selectedProductForUpdate.name || 'Product'}
          isLoading={isUpdatingStock}
        />
      )}
    </div>
  );
}