import { useEffect, useId, useRef, useState } from 'react';
import { useDebouncedCallback } from '@/shared/lib/useDebouncedCallback';
import { MAX_QUERY_LENGTH } from '../../hooks/useCatalogParams';

export const SEARCH_DEBOUNCE_MS = 250;

interface SearchBoxProps {
  value: string;
  onSearch: (query: string) => void;
}

/**
 * Typing stays local and instant; the URL is updated after a short pause (or on Enter). If the URL
 * changes from outside (back button, "Clear filters"), the input follows it.
 */
export function SearchBox({ value, onSearch }: SearchBoxProps) {
  const inputId = useId();
  const [draft, setDraft] = useState(value);
  const committed = useRef(value);
  const { run, flush, cancel } = useDebouncedCallback((query: string) => {
    committed.current = query.trim();
    onSearch(query);
  }, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      cancel();
      setDraft(value);
    }
  }, [value, cancel]);

  return (
    // role="search" rather than <search>: same landmark, but works in every browser and in jsdom.
    <form
      role="search"
      className="flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        flush();
      }}
    >
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
        Search products
      </label>
      <input
        id={inputId}
        type="search"
        value={draft}
        maxLength={MAX_QUERY_LENGTH}
        autoComplete="off"
        spellCheck={false}
        placeholder="e.g. jacket"
        onChange={(event) => {
          setDraft(event.target.value);
          run(event.target.value);
        }}
        className="min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3 placeholder:text-ink-muted"
      />
    </form>
  );
}
