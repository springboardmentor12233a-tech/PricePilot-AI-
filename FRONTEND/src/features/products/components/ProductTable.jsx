import React from 'react';
import ProductStatusBadge from './ProductStatusBadge';
import ProductActions from './ProductActions';
import { formatCurrency } from '../../../utils/formatCurrency';
import { Package } from 'lucide-react';

export default function ProductTable({
  products = [],
  categories = [],
  onView,
  onEdit,
  onDelete,
}) {
  const categoryMap = new Map(categories.map((c) => [String(c.id), c.name]));

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
      <table className="w-full text-left text-sm text-[#0F172A]">
        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
          <tr>
            <th scope="col" className="py-3.5 pl-5 pr-3">Product</th>
            <th scope="col" className="py-3.5 px-3">SKU</th>
            <th scope="col" className="py-3.5 px-3">Category</th>
            <th scope="col" className="py-3.5 px-3">Brand</th>
            <th scope="col" className="py-3.5 px-3 text-right">Cost Price</th>
            <th scope="col" className="py-3.5 px-3 text-right">Base Price</th>
            <th scope="col" className="py-3.5 px-3 text-center">Status</th>
            <th scope="col" className="py-3.5 pl-3 pr-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F5F9]">
          {products.map((product) => {
            const categoryName = product.category_id
              ? categoryMap.get(String(product.category_id)) || product.category?.name || '—'
              : product.category?.name || '—';

            return (
              <tr
                key={product.id}
                onClick={() => onView(product.id)}
                className="hover:bg-[#F8FAFC]/80 transition-colors cursor-pointer group"
              >
                {/* Product Name & Visual */}
                <td className="py-3.5 pl-5 pr-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name || 'Product'}
                          className="w-full h-full object-cover rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                        {product.name || '—'}
                      </p>
                      {product.description && (
                        <p className="text-[11px] text-[#64748B] line-clamp-1 max-w-[220px]">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* SKU */}
                <td className="py-3.5 px-3 font-mono text-xs text-[#64748B]">
                  {product.sku || '—'}
                </td>

                {/* Category */}
                <td className="py-3.5 px-3 text-xs text-[#0F172A]">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] font-medium">
                    {categoryName}
                  </span>
                </td>

                {/* Brand */}
                <td className="py-3.5 px-3 text-xs text-[#64748B]">
                  {product.brand || '—'}
                </td>

                {/* Cost Price */}
                <td className="py-3.5 px-3 text-right text-xs font-mono text-[#64748B]">
                  {formatCurrency(product.cost_price, product.currency)}
                </td>

                {/* Base Price */}
                <td className="py-3.5 px-3 text-right text-xs font-mono font-semibold text-[#0F172A]">
                  {formatCurrency(product.base_price, product.currency)}
                </td>

                {/* Status */}
                <td className="py-3.5 px-3 text-center">
                  <ProductStatusBadge isActive={product.is_active} />
                </td>

                {/* Actions */}
                <td className="py-3.5 pl-3 pr-5 text-right">
                  <ProductActions
                    onView={() => onView(product.id)}
                    onEdit={() => onEdit(product)}
                    onDelete={() => onDelete(product)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
