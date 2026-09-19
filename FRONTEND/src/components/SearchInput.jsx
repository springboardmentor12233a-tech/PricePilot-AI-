import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Package, Users2, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useOrganization } from '../features/organizations/hooks/useOrganization';
import { productApi } from '../features/products/services/productApi';
import { competitorApi } from '../features/competitors/services/competitorApi';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Reusable Global Search Component
 * Client-side search across loaded catalog products, SKUs, competitors, and quick navigation routes.
 * Supports Cmd+K / Ctrl+K shortcut, accessible keyboard navigation, and honest availability states.
 */
export default function SearchInput({
  placeholder = 'Search products, SKUs, competitors (⌘K)...',
  className = '',
  id = 'global-search',
}) {
  const navigate = useNavigate();
  const { selectedOrganizationId } = useOrganization();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Load products and competitors for client-side search when organization is selected
  useEffect(() => {
    if (!selectedOrganizationId) {
      setProducts([]);
      setCompetitors([]);
      return;
    }

    let isMounted = true;
    setIsLoadingData(true);

    Promise.allSettled([
      productApi.getProducts(selectedOrganizationId),
      competitorApi.getCompetitors(selectedOrganizationId),
    ]).then(([prodRes, compRes]) => {
      if (!isMounted) return;
      if (prodRes.status === 'fulfilled') {
        const list = Array.isArray(prodRes.value) ? prodRes.value : prodRes.value?.items || [];
        setProducts(list);
      }
      if (compRes.status === 'fulfilled') {
        const list = Array.isArray(compRes.value) ? compRes.value : compRes.value?.items || [];
        setCompetitors(list);
      }
      setIsLoadingData(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedOrganizationId]);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items based on user query
  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return { products: [], competitors: [], pages: [] };

    // 1. Filter Products
    const matchedProducts = products
      .filter((p) => {
        const name = (p.name || '').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        return name.includes(trimmed) || sku.includes(trimmed) || category.includes(trimmed);
      })
      .slice(0, 5);

    // 2. Filter Competitors
    const matchedCompetitors = competitors
      .filter((c) => {
        const name = (c.name || '').toLowerCase();
        const website = (c.website || '').toLowerCase();
        return name.includes(trimmed) || website.includes(trimmed);
      })
      .slice(0, 3);

    // 3. Quick module navigation shortcuts
    const quickRoutes = [
      { name: 'Dashboard', path: '/dashboard', keywords: ['dash', 'home', 'overview', 'kpi'] },
      { name: 'Products Catalog', path: '/products', keywords: ['prod', 'catalog', 'items', 'add product'] },
      { name: 'Inventory Management', path: '/inventory', keywords: ['inv', 'stock', 'warehouse', 'supplies'] },
      { name: 'Competitor Intelligence', path: '/competitors', keywords: ['comp', 'rival', 'market', 'track'] },
      { name: 'Demand Forecasting', path: '/forecast', keywords: ['fore', 'demand', 'predict', 'xgboost'] },
      { name: 'Pricing Intelligence', path: '/pricing', keywords: ['price', 'pricing', 'elasticity', 'rule'] },
      { name: 'Pricing Recommendations', path: '/recommendations', keywords: ['rec', 'recommend', 'decision'] },
      { name: 'Revenue Optimization', path: '/revenue-simulation', keywords: ['rev', 'sim', 'profit', 'optimize'] },
      { name: 'Pricing Analytics', path: '/pricing-analytics', keywords: ['anal', 'metrics', 'historical'] },
    ];

    const matchedPages = quickRoutes
      .filter((r) => r.name.toLowerCase().includes(trimmed) || r.keywords.some((k) => k.includes(trimmed)))
      .slice(0, 3);

    return {
      products: matchedProducts,
      competitors: matchedCompetitors,
      pages: matchedPages,
    };
  }, [query, products, competitors]);

  const totalResultsCount =
    filteredResults.products.length +
    filteredResults.competitors.length +
    filteredResults.pages.length;

  // Flatten results for keyboard arrow navigation
  const flatItems = useMemo(() => {
    const list = [];
    filteredResults.products.forEach((p) =>
      list.push({ type: 'product', id: p.id, label: p.name, path: `/products?id=${p.id}` })
    );
    filteredResults.competitors.forEach((c) =>
      list.push({ type: 'competitor', id: c.id, label: c.name, path: `/competitors` })
    );
    filteredResults.pages.forEach((page) =>
      list.push({ type: 'page', id: page.path, label: page.name, path: page.path })
    );
    return list;
  }, [filteredResults]);

  const handleSelect = (path) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen || flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatItems[selectedIndex];
      if (selected) {
        handleSelect(selected.path);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3.5 text-[#94A3B8] pointer-events-none flex items-center">
        <Search className="w-4 h-4" aria-hidden="true" />
      </div>

      <input
        ref={inputRef}
        id={id}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setSelectedIndex(0);
        }}
        onFocus={() => {
          if (query.trim()) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Global search across products, competitors, and modules"
        autoComplete="off"
        className="w-full h-10 pl-10 pr-16 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] transition-all duration-150 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
      />

      <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="pointer-events-auto p-1 text-[#94A3B8] hover:text-[#0F172A] rounded cursor-pointer"
            aria-label="Clear search query"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-[#94A3B8] bg-white border border-[#E2E8F0] rounded shadow-2xs">
            ⌘K
          </span>
        )}
      </div>

      {/* Floating Search Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 overflow-hidden max-h-[360px] overflow-y-auto">
          {totalResultsCount > 0 ? (
            <div className="p-2 space-y-3">
              {/* Products Section */}
              {filteredResults.products.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3 h-3" />
                    <span>Products ({filteredResults.products.length})</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {filteredResults.products.map((p) => {
                      const flatIdx = flatItems.findIndex((item) => item.id === p.id);
                      const isHighlighted = flatIdx === selectedIndex;

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelect(`/products?id=${p.id}`)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between group transition-colors cursor-pointer ${
                            isHighlighted ? 'bg-[#EFF6FF] text-[#2563EB]' : 'hover:bg-[#F8FAFC] text-[#0F172A]'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-semibold truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748B]">
                              {p.sku && <span className="font-mono text-[10px]">{p.sku}</span>}
                              {p.category && <span>• {p.category}</span>}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="font-mono font-medium block">
                              {formatCurrency(p.base_price, p.currency || 'INR')}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Competitors Section */}
              {filteredResults.competitors.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                    <Users2 className="w-3 h-3" />
                    <span>Competitors ({filteredResults.competitors.length})</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {filteredResults.competitors.map((c) => {
                      const flatIdx = flatItems.findIndex((item) => item.id === c.id);
                      const isHighlighted = flatIdx === selectedIndex;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelect(`/competitors`)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between group transition-colors cursor-pointer ${
                            isHighlighted ? 'bg-[#EFF6FF] text-[#2563EB]' : 'hover:bg-[#F8FAFC] text-[#0F172A]'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{c.name}</p>
                            {c.website && (
                              <p className="text-[11px] text-[#64748B] truncate mt-0.5">{c.website}</p>
                            )}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 group-hover:text-[#2563EB]" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Navigation Section */}
              {filteredResults.pages.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                    <CornerDownLeft className="w-3 h-3" />
                    <span>Quick Navigation</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {filteredResults.pages.map((page) => {
                      const flatIdx = flatItems.findIndex((item) => item.id === page.path);
                      const isHighlighted = flatIdx === selectedIndex;

                      return (
                        <button
                          key={page.path}
                          type="button"
                          onClick={() => handleSelect(page.path)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between group transition-colors cursor-pointer ${
                            isHighlighted ? 'bg-[#EFF6FF] text-[#2563EB]' : 'hover:bg-[#F8FAFC] text-[#0F172A]'
                          }`}
                        >
                          <span className="font-medium">{page.name}</span>
                          <span className="text-[10px] text-[#94A3B8] font-mono">{page.path}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[#64748B]">
              <p className="font-medium text-[#0F172A]">No products or competitors found for "{query}".</p>
              <p className="text-[11px] text-[#94A3B8] mt-1">
                Search queries match product names, SKUs, competitor names, or module shortcuts.
              </p>
            </div>
          )}

          <div className="px-3 py-2 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>Use ↑↓ arrows to navigate, Enter to select</span>
            <span>ESC to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
