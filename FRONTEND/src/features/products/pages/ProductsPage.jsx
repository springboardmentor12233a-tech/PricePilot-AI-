import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductHeader from '../components/ProductHeader';
import ProductSearch from '../components/ProductSearch';
import ProductFilters from '../components/ProductFilters';
import ProductTable from '../components/ProductTable';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import DeleteProductDialog from '../components/DeleteProductDialog';
import EmptyState from '../../../components/EmptyState';
import { useProducts } from '../hooks/useProducts';
import { useProductMutations } from '../hooks/useProductMutations';
import { useCategories } from '../../categories/hooks/useCategories';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { filterProducts, sortProducts } from '../utils/productHelpers';
import { useToast } from '../../../hooks/useToast';
import { Package, Plus, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import Button from '../../../components/Button';

export default function ProductsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedOrganizationId, currentOrganization } = useOrganization();

  // Products and categories loaded for active organization
  const {
    products,
    isLoading: isLoadingProducts,
    error: productsError,
    refresh: refreshProducts,
  } = useProducts(selectedOrganizationId);

  const {
    categories,
    isLoading: isLoadingCategories,
  } = useCategories(selectedOrganizationId);

  const {
    createProduct,
    updateProduct,
    deleteProduct,
    isMutating,
  } = useProductMutations();

  // Filter & Search state
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Filter & Sort products in-memory
  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(products, { search, categoryId, status });
    return sortProducts(filtered, sortBy);
  }, [products, search, categoryId, status, sortBy]);

  // Category name lookup map
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [String(c.id), c.name]));
  }, [categories]);

  // Handlers
  const handleCreateSubmit = async (payload) => {
    try {
      await createProduct(payload);
      toast.success('Product created successfully.');
      setIsCreateModalOpen(false);
      refreshProducts();
    } catch (err) {
      toast.error(err.message || 'Unable to create product.');
    }
  };

  const handleEditSubmit = async (payload) => {
    if (!editingProduct) return;
    try {
      await updateProduct(editingProduct.id, payload);
      toast.success('Product updated successfully.');
      setEditingProduct(null);
      refreshProducts();
    } catch (err) {
      toast.error(err.message || 'Unable to update product.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct.id);
      toast.success('Product deleted successfully.');
      setDeletingProduct(null);
      refreshProducts();
    } catch (err) {
      toast.error(err.message || 'Unable to delete product.');
    }
  };

  // If no organization is selected yet
  if (!selectedOrganizationId) {
    return (
      <div className="space-y-6">
        <ProductHeader onAddProduct={() => toast.info('Select an active organization to manage products.')} />
        <EmptyState
          icon={Layers}
          title="No Organization Selected"
          description="Select or create a workspace organization to view and manage catalog products."
          actionText="Go to Organizations"
          onAction={() => navigate('/organization')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProductHeader
        onAddProduct={() => setIsCreateModalOpen(true)}
        onRefresh={refreshProducts}
        isLoading={isLoadingProducts}
        totalCount={products.length}
      />

      {/* Error state */}
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
            onClick={refreshProducts}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Controls Bar: Search & Filters */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <ProductSearch
          value={search}
          onChange={setSearch}
          placeholder="Search products by name, SKU, brand..."
        />

        <ProductFilters
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          status={status}
          onStatusChange={setStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Loading Skeleton */}
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
        /* Empty State: Zero products in organization */
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to start managing pricing and inventory."
          actionText="Add Product"
          onAction={() => setIsCreateModalOpen(true)}
          actionIcon={Plus}
        />
      ) : filteredProducts.length === 0 ? (
        /* Filtered Empty State */
        <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-12 text-center">
          <Package className="w-8 h-8 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#0F172A]">No matching products</h3>
          <p className="text-xs text-[#64748B] mt-1 mb-4">
            No products match your current search query or filter criteria.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setCategoryId('all');
              setStatus('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <ProductTable
              products={filteredProducts}
              categories={categories}
              onView={(id) => navigate(`/products/${id}`)}
              onEdit={(prod) => setEditingProduct(prod)}
              onDelete={(prod) => setDeletingProduct(prod)}
            />
          </div>

          {/* Mobile Card Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                categoryName={
                  prod.category_id
                    ? categoryMap.get(String(prod.category_id)) || prod.category?.name || '—'
                    : prod.category?.name || '—'
                }
                onView={(id) => navigate(`/products/${id}`)}
                onEdit={(p) => setEditingProduct(p)}
                onDelete={(p) => setDeletingProduct(p)}
              />
            ))}
          </div>
        </>
      )}

      {/* Create Product Modal */}
      <ProductForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={isMutating}
      />

      {/* Edit Product Modal */}
      <ProductForm
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        onSubmit={handleEditSubmit}
        initialData={editingProduct}
        isLoading={isMutating}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteConfirm}
        productName={deletingProduct?.name || 'this product'}
        isLoading={isMutating}
      />
    </div>
  );
}
