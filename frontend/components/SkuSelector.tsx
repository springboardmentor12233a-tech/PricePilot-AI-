'use client';

import React, { useState } from 'react';
import { Search, RefreshCw, Layers } from 'lucide-react';

export const SAMPLE_SKUS = [
  { id: '293375605257', label: 'SKU #293375605257 (Standard Benchmark Item)' },
  { id: 'da17e2d5feda', label: 'SKU #da17e2d5feda (Catalog Fast Mover)' },
  { id: '77c4fb3158b0', label: 'SKU #77c4fb3158b0 (Promo Active SKU)' },
  { id: 'e16447cbe9b7', label: 'SKU #e16447cbe9b7 (Multi-Store SKU)' },
];

export const SAMPLE_STORES = [
  { id: 1, label: 'Store 1 (Flagship Metro)' },
  { id: 2, label: 'Store 2 (Suburban Center)' },
  { id: 3, label: 'Store 3 (Regional Hub)' },
  { id: 4, label: 'Store 4 (Express Outlet)' },
];

interface SkuSelectorProps {
  itemId: string;
  storeId: number;
  onSearch: (itemId: string, storeId: number) => void;
  isLoading?: boolean;
  extraControls?: React.ReactNode;
}

export function SkuSelector({
  itemId,
  storeId,
  onSearch,
  isLoading = false,
  extraControls,
}: SkuSelectorProps) {
  const [localItem, setLocalItem] = useState(itemId);
  const [localStore, setLocalStore] = useState(storeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localItem.trim()) {
      onSearch(localItem.trim(), localStore);
    }
  };

  const handleSampleClick = (sku: string) => {
    setLocalItem(sku);
    onSearch(sku, localStore);
  };

  return (
    <div className="control-bar">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end', flex: 1 }}>
        <div className="form-group" style={{ flex: '1 1 240px' }}>
          <label className="form-label">Product SKU Identifier (item_id)</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={localItem}
              onChange={(e) => setLocalItem(e.target.value)}
              placeholder="e.g. 293375605257"
              className="form-input"
              style={{ width: '100%', paddingLeft: '36px' }}
            />
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        <div className="form-group" style={{ width: '180px' }}>
          <label className="form-label">Store Location (store_id)</label>
          <select
            value={localStore}
            onChange={(e) => setLocalStore(Number(e.target.value))}
            className="form-select"
            style={{ width: '100%' }}
          >
            {SAMPLE_STORES.map((s) => (
              <option key={s.id} value={s.id}>
                Store {s.id}
              </option>
            ))}
          </select>
        </div>

        {extraControls}

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Computing...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Evaluate SKU
            </>
          )}
        </button>
      </form>

      {/* Quick sample chips */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid rgba(51, 65, 85, 0.4)' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Layers size={13} /> Quick SKUs:
        </span>
        {SAMPLE_SKUS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleSampleClick(s.id)}
            style={{
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: localItem === s.id ? 'rgba(99, 102, 241, 0.25)' : 'var(--bg-surface)',
              border: localItem === s.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              color: localItem === s.id ? '#c7d2fe' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {s.id}
          </button>
        ))}
      </div>
    </div>
  );
}
