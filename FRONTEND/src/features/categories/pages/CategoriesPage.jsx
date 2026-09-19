import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import CategoryList from '../components/CategoryList';
import CategoryForm from '../components/CategoryForm';
import EmptyState from '../../../components/EmptyState';
import { useCategories } from '../hooks/useCategories';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { Plus, RefreshCw, AlertCircle, Layers } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedOrganizationId } = useOrganization();

  const {
    categories,
    isLoading,
    error,
    refresh,
  } = useCategories(selectedOrganizationId);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!selectedOrganizationId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Categories"
          description="Organize products across your catalog."
        />
        <EmptyState
          icon={Layers}
          title="No Organization Selected"
          description="Select or create an active organization workspace to manage categories."
          actionText="Go to Organizations"
          onAction={() => navigate('/organization')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize products across your catalog."
        badge={
          categories.length > 0 ? (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100">
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </span>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              leftIcon={RefreshCw}
              onClick={refresh}
              disabled={isLoading}
              className={isLoading ? 'animate-spin' : ''}
              title="Refresh categories"
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Category
            </Button>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 text-sm text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={refresh}
          >
            Retry
          </Button>
        </div>
      )}

      {isLoading && categories.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-white border border-[#E2E8F0] rounded-2xl p-5" />
          ))}
        </div>
      ) : (
        <CategoryList
          categories={categories}
          onAddCategory={() => setIsCreateModalOpen(true)}
        />
      )}

      <CategoryForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
