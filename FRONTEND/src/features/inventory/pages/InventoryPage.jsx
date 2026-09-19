import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Boxes, RefreshCw, AlertCircle, Search, Layers, Plus } from 'lucide-react';

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

  if (!selectedOrganizationId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Inventory"
          description="Monitor stock levels and inventory health."
        />
        <EmptyState
          icon={Layers}
          title="No Organization Selected"
          description="Select an active organization workspace to view inventory records."
          actionText="Go to Organizations"
          onAction={() => navigate('/organization')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Real Inventory Metrics (Shown only from loaded real data) */}
      {stats.hasLoadedAny && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
            <span className="text-xs text-[#64748B] block">Total Stock Units</span>
            <span className="text-xl font-bold font-mono text-[#0F172A] mt-1 block">
              {stats.totalOnHand.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
            <span className="text-xs text-[#64748B] block">Healthy Items</span>
            <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">
              {stats.healthyCount}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
            <span className="text-xs text-[#64748B] block">Low Stock Alerts</span>
            <span className="text-xl font-bold font-mono text-amber-600 mt-1 block">
              {stats.lowStockCount}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
            <span className="text-xs text-[#64748B] block">Out of Stock</span>
            <span className="text-xl font-bold font-mono text-rose-600 mt-1 block">
              {stats.outOfStockCount}
            </span>
          </div>
        </div>
      )}

      {productsError && (
        <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 text-sm text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
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
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:min-w-[240px]">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory by product or SKU..."
            className="w-full h-10.5 pl-9 pr-4 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </div>

        <div className="w-full sm:w-44 shrink-0">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full h-10.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
            aria-label="Filter inventory by health status"
          >
            <option value="all">All Statuses</option>
            <option value="healthy">Healthy</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {isLoadingProducts && products.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 animate-pulse space-y-4">
          <div className="h-6 w-48 bg-[#E2E8F0] rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-[#F8FAFC] rounded-xl" />
            ))}
          </div>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No products in catalog"
          description="Add products to your catalog to start tracking warehouse inventory and stock velocity."
          actionText="Add Product"
          onAction={() => navigate('/products')}
          actionIcon={Plus}
        />
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-12 text-center">
          <Boxes className="w-8 h-8 text-[#94A3B8] mx-auto mb-3" />
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
          <div className="hidden md:block">
            <InventoryTable
              items={filteredItems}
              onUpdateStock={(product, inv) => setSelectedProductForUpdate(product)}
              onViewProduct={(id) => navigate(`/products/${id}`)}
            />
          </div>

          {/* Mobile Card Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
            {filteredItems.map(({ product, inventory, isLoading }) => (
              <InventoryCard
                key={product.id}
                product={product}
                inventory={inventory}
                isLoading={isLoading}
                onUpdateStock={(prod) => setSelectedProductForUpdate(prod)}
                onViewProduct={(id) => navigate(`/products/${id}`)}
              />
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
