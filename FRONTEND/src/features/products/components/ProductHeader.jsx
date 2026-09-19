import React from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import { Plus, RefreshCw } from 'lucide-react';

export default function ProductHeader({
  onAddProduct,
  onRefresh,
  isLoading = false,
  totalCount = null,
}) {
  return (
    <PageHeader
      title="Products"
      description="Manage your product catalog, pricing and inventory."
      badge={
        totalCount !== null ? (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100">
            {totalCount} {totalCount === 1 ? 'Product' : 'Products'}
          </span>
        ) : null
      }
      actions={
        <div className="flex items-center gap-2.5">
          {onRefresh && (
            <Button
              variant="outline"
              size="md"
              leftIcon={RefreshCw}
              onClick={onRefresh}
              disabled={isLoading}
              className={isLoading ? 'animate-spin' : ''}
              title="Refresh products list"
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={onAddProduct}
          >
            Add Product
          </Button>
        </div>
      }
    />
  );
}
