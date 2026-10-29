import { useEffect, useRef } from 'react';
import {
  FilterBar,
  Pagination,
  ProductGrid,
  ProductGridSkeleton,
  SORT_LABELS,
  useCatalog,
} from '@/features/catalog';
import { announce } from '@/shared/lib/announce';
import { pluralize } from '@/shared/lib/pluralize';
import { useDebouncedCallback } from '@/shared/lib/useDebouncedCallback';
import { Button, EmptyState, ErrorState, PageHeading } from '@/shared/ui';
import { APP_NAME } from '../appName';

export function CatalogPage() {
  const {
    params,
    setParams,
    clearFilters,
    hrefForPage,
    page,
    isLoading,
    isError,
    isUpdating,
    retry,
  } = useCatalog();
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const hasFilters = params.category !== null || params.q.trim() !== '';

  // Results change without a page load, so the count is the feedback. Debounced, so a screen
  // reader does not speak on every keystroke.
  const { run: announceResults } = useDebouncedCallback(
    (message: string) => announce(message),
    600,
  );
  const lastAnnounced = useRef<string | null>(null);
  const resultsMessage = page ? `${pluralize(page.total, 'product')} found` : null;
  useEffect(() => {
    if (resultsMessage === null) return;
    if (lastAnnounced.current !== null && lastAnnounced.current !== resultsMessage) {
      announceResults(resultsMessage);
    }
    lastAnnounced.current = resultsMessage;
  }, [resultsMessage, announceResults]);

  // After a page change (not on first load), move focus to the results heading once the new page
  // has rendered, so keyboard users start at the top of the new results.
  const previousPage = useRef(params.page);
  const focusResultsWhenReady = useRef(false);
  const hasPage = page !== undefined;
  useEffect(() => {
    if (previousPage.current !== params.page) {
      previousPage.current = params.page;
      focusResultsWhenReady.current = true;
    }
    if (focusResultsWhenReady.current && hasPage && !isUpdating) {
      focusResultsWhenReady.current = false;
      resultsHeadingRef.current?.focus();
    }
  }, [params.page, hasPage, isUpdating]);

  const firstItem = page && page.total > 0 ? (page.page - 1) * page.pageSize + 1 : 0;
  const lastItem = page ? Math.min(page.page * page.pageSize, page.total) : 0;

  return (
    <div className="flex flex-col gap-6">
      <title>{`Products · ${APP_NAME}`}</title>
      <PageHeading>All products</PageHeading>

      <FilterBar
        params={{ ...params, category: page?.category ?? params.category }}
        categories={page?.categories ?? []}
        onSearch={(q) => setParams({ q }, { replace: true })}
        onCategoryChange={(category) => setParams({ category })}
        onSortChange={(sort) => setParams({ sort })}
      />

      <section aria-labelledby="results-heading" className="flex flex-col gap-4" id="results">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="results-heading"
            ref={resultsHeadingRef}
            tabIndex={-1}
            className="text-lg font-semibold"
          >
            Results
          </h2>
          {page && page.total > 0 && (
            <p className="text-sm text-ink-muted">
              Showing {firstItem}–{lastItem} of {page.total}
              <span className="sr-only">, sorted by {SORT_LABELS[params.sort]}</span>
            </p>
          )}
        </div>

        {isLoading ? (
          <ProductGridSkeleton />
        ) : isError || !page ? (
          <ErrorState
            title="We couldn't load products"
            message="Something went wrong while contacting the store. Check your connection and try again."
            onRetry={() => void retry()}
          />
        ) : page.catalogSize === 0 ? (
          <EmptyState title="No products available right now" message="Please check back soon." />
        ) : page.total === 0 ? (
          <EmptyState
            title="No matching products"
            message={describeEmptyResults(params.q, page.category)}
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ProductGrid products={page.items} dimmed={isUpdating} />
            <Pagination page={page.page} pageCount={page.pageCount} hrefForPage={hrefForPage} />
          </>
        )}
      </section>
    </div>
  );
}

function describeEmptyResults(q: string, category: string | null): string {
  const query = q.trim();
  if (query && category) return `No products match "${query}" in ${category}.`;
  if (query) return `No products match "${query}".`;
  return category ? `No products in ${category}.` : 'No products match your filters.';
}
