import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import CategoryList from '../components/CategoryList';
import CategoryForm from '../components/CategoryForm';
import EmptyState from '../../../components/EmptyState';
import { useCategories } from '../hooks/useCategories';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import {
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  Layers,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  X,
} from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

const PAGE_SIZE = 12;
const DEFAULT_SORT = 'name-asc';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const getName = (c) => c?.name ?? '';
const getCreated = (c) => Date.parse(c?.createdAt ?? c?.created_at ?? '') || 0;
const getProductCount = (c) =>
  c?.productCount ??
  c?.productsCount ??
  c?.products_count ??
  (Array.isArray(c?.products) ? c.products.length : null);

const hasDates = (list) => list.some((c) => getCreated(c) > 0);
const hasCounts = (list) => list.some((c) => getProductCount(c) !== null);

// `available` hides sort options the data can't support (e.g. no createdAt field).
const SORTS = {
  'name-asc': {
    label: 'Name, A to Z',
    compare: (a, b) => collator.compare(getName(a), getName(b)),
  },
  'name-desc': {
    label: 'Name, Z to A',
    compare: (a, b) => collator.compare(getName(b), getName(a)),
  },
  newest: {
    label: 'Newest first',
    compare: (a, b) => getCreated(b) - getCreated(a),
    available: hasDates,
  },
  oldest: {
    label: 'Oldest first',
    compare: (a, b) => getCreated(a) - getCreated(b),
    available: hasDates,
  },
  products: {
    label: 'Most products',
    compare: (a, b) =>
      (getProductCount(b) ?? -1) - (getProductCount(a) ?? -1) ||
      collator.compare(getName(a), getName(b)),
    available: hasCounts,
  },
};

const plural = (n, one, many) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

// Lets the Refresh button spin its icon instead of the whole button.
const SpinningRefresh = ({ className = '', ...props }) => (
  <RefreshCw {...props} className={`${className} animate-spin motion-reduce:animate-none`} />
);

function CategorySkeleton() {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
      <div className="h-10 w-10 rounded-xl bg-[#EEF2F7]" />
      <div className="mt-4 h-4 w-2/3 rounded bg-[#EEF2F7]" />
      <div className="mt-3 h-3 w-full rounded bg-[#F1F5F9]" />
      <div className="mt-2 h-3 w-4/5 rounded bg-[#F1F5F9]" />
      <div className="mt-8 h-3 w-1/3 rounded bg-[#F1F5F9]" />
    </div>
  );
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedOrganizationId } = useOrganization();
  const [searchParams, setSearchParams] = useSearchParams();

  const { categories, isLoading, error, refresh } = useCategories(selectedOrganizationId);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchRef = useRef(null);

  // Search and sort live in the URL, so a filtered view can be shared or bookmarked.
  const query = searchParams.get('q') ?? '';
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const availableSorts = useMemo(
    () =>
      Object.entries(SORTS).filter(([, option]) => !option.available || option.available(categories)),
    [categories],
  );
  const requestedSort = searchParams.get('sort');
  const sort = availableSorts.some(([key]) => key === requestedSort) ? requestedSort : DEFAULT_SORT;

  const updateParams = useCallback(
    (patch) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const filtered = useMemo(() => {
    const matches = normalizedQuery
      ? categories.filter((c) =>
          `${c.name ?? ''} ${c.description ?? ''}`.toLowerCase().includes(normalizedQuery),
        )
      : categories;
    return [...matches].sort(SORTS[sort].compare);
  }, [categories, normalizedQuery, sort]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const remaining = filtered.length - visible.length;

  const totalProducts = useMemo(
    () =>
      hasCounts(categories)
        ? categories.reduce((sum, c) => sum + (getProductCount(c) ?? 0), 0)
        : null,
    [categories],
  );

  // Start from the first page whenever the result set changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [normalizedQuery, sort, selectedOrganizationId]);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Categories | PricePilot AI';
    return () => {
      document.title = previous;
    };
  }, []);

  // Press "/" anywhere on the page to jump to search.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const el = event.target;
      const typing =
        el instanceof HTMLElement &&
        (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
      if (typing) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const openCreate = useCallback(() => setIsCreateModalOpen(true), []);

  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
    } catch {
      toast.error('Check your connection and try again.', { title: 'Couldn’t refresh categories' });
    }
  }, [refresh, toast]);

  const handleCreated = useCallback(
    (created) => {
      refresh();
      toast.success(created?.name ? `“${created.name}” created` : 'Category created');
    },
    [refresh, toast],
  );

  const clearSearch = () => {
    updateParams({ q: '' });
    searchRef.current?.focus();
  };

  if (!selectedOrganizationId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Categories"
          description="Organize products across your catalog."
        />
        <EmptyState
          icon={Layers}
          title="No organization selected"
          description="Select or create an active organization workspace to manage categories."
          actionText="Go to organizations"
          onAction={() => navigate('/organization')}
        />
      </div>
    );
  }

  const isInitialLoad = isLoading && categories.length === 0;
  const isRefreshing = isLoading && categories.length > 0;
  const isCatalogEmpty = !isLoading && !error && categories.length === 0;
  const isSearching = normalizedQuery.length > 0;

  const summary = isSearching
    ? `${filtered.length.toLocaleString()} of ${plural(categories.length, 'category', 'categories')}`
    : plural(categories.length, 'category', 'categories') +
      (totalProducts !== null ? ` with ${plural(totalProducts, 'product', 'products')}` : '');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize products across your catalog."
        badge={
          categories.length > 0 ? (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
              {plural(categories.length, 'category', 'categories')}
            </span>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              leftIcon={isLoading ? SpinningRefresh : RefreshCw}
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh categories"
              aria-label="Refresh categories"
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="primary" size="md" leftIcon={Plus} onClick={openCreate}>
              Create category
            </Button>
          </div>
        }
      />

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#DC2626]" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" leftIcon={RefreshCw} onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:p-4">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => updateParams({ q: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && query) clearSearch();
              }}
              placeholder="Search by name or description"
              aria-label="Search categories"
              autoComplete="off"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-10 text-sm text-[#0F172A] transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-[#94A3B8] transition-colors hover:bg-[#E2E8F0] hover:text-[#0F172A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563EB]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[#E2E8F0] bg-white px-1.5 text-xs text-[#94A3B8] sm:inline">
                /
              </kbd>
            )}
          </div>

          <div className="relative sm:w-52">
            <ArrowUpDown
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
              aria-hidden="true"
            />
            <select
              value={sort}
              onChange={(event) =>
                updateParams({ sort: event.target.value === DEFAULT_SORT ? '' : event.target.value })
              }
              aria-label="Sort categories"
              className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-9 text-sm text-[#0F172A] transition focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10"
            >
              {availableSorts.map(([key, option]) => (
                <option key={key} value={key}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {isInitialLoad && (
        <div
          role="status"
          aria-busy="true"
          className="grid animate-pulse grid-cols-1 gap-5 motion-reduce:animate-none sm:grid-cols-2 lg:grid-cols-3"
        >
          <span className="sr-only">Loading categories</span>
          {Array.from({ length: 6 }, (_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      )}

      {isCatalogEmpty && (
        <EmptyState
          icon={Layers}
          title="No categories yet"
          description="Create your first category to start grouping products."
          actionText="Create category"
          onAction={openCreate}
        />
      )}

      {categories.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3 text-sm text-[#64748B]">
            <p aria-live="polite">{summary}</p>
            {isSearching && (
              <button
                type="button"
                onClick={clearSearch}
                className="cursor-pointer rounded font-medium text-[#2563EB] transition-colors hover:text-[#1D4ED8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
              >
                Clear search
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={`No categories match “${query.trim()}”`}
              description="Check the spelling, or try a shorter search."
              actionText="Clear search"
              onAction={clearSearch}
            />
          ) : (
            <div
              aria-busy={isRefreshing}
              className={`transition-opacity duration-300 ${
                isRefreshing ? 'opacity-60' : 'opacity-100'
              }`}
            >
              <CategoryList categories={visible} onAddCategory={openCreate} />
            </div>
          )}

          {remaining > 0 && (
            <div className="flex flex-col items-center gap-2 pt-1">
              <p className="text-xs text-[#64748B]">
                Showing {visible.length} of {filtered.length}
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Show {Math.min(PAGE_SIZE, remaining)} more
              </Button>
            </div>
          )}
        </>
      )}

      <CategoryForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreated}
      />
    </div>
  );
}