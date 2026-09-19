import React from 'react';
import { Download, Printer } from 'lucide-react';
import Button from '../../../components/Button';
import { exportToCsv } from '../utils/analyticsUtils';
import { useToast } from '../../../hooks/useToast';

export default function ReportActions({
  filteredProducts = [],
  categories = [],
  summaryMetrics = {},
  selectedProduct = null,
}) {
  const toast = useToast();

  const handleExportCsv = () => {
    if (!filteredProducts || filteredProducts.length === 0) {
      toast.info('No products available in the current filter to export.');
      return;
    }

    const headers = [
      { label: 'Product Name', key: 'name' },
      { label: 'SKU', key: 'sku' },
      { label: 'Category', key: 'category' },
      { label: 'Current Price (INR)', key: 'price' },
      { label: 'Cost Price (INR)', key: 'cost_price' },
      { label: 'Discount (%)', key: 'discount' },
      { label: 'Last Updated', key: 'updated_at' },
    ];

    const rows = filteredProducts.map((p) => {
      const cat = categories.find((c) => String(c.id) === String(p.category_id))?.name || p.category?.name || '—';
      return {
        name: p.name || '—',
        sku: p.sku || '—',
        category: cat,
        price: p.base_price !== null && p.base_price !== undefined ? Number(p.base_price) : '—',
        cost_price: p.cost_price !== null && p.cost_price !== undefined ? Number(p.cost_price) : '—',
        discount: p.discount !== null && p.discount !== undefined ? `${Number(p.discount)}%` : '0%',
        updated_at: p.updated_at || p.created_at || '—',
      };
    });

    exportToCsv('pricepilot-pricing-analytics.csv', headers, rows);
    toast.success('Downloaded pricepilot-pricing-analytics.csv');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button
        variant="outline"
        size="md"
        leftIcon={Download}
        onClick={handleExportCsv}
        aria-label="Export analytics dataset to CSV"
      >
        Export CSV
      </Button>

      <Button
        variant="outline"
        size="md"
        leftIcon={Printer}
        onClick={handlePrint}
        aria-label="Print or save analytics report as PDF"
      >
        Print / PDF
      </Button>
    </div>
  );
}
