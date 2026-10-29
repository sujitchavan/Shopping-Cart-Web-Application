import { clsx } from 'clsx';
import { useId, useState } from 'react';
import { Button } from '@/shared/ui';
import type { CatalogParams } from '../../hooks/useCatalogParams';
import type { SortKey } from '../../model/types';
import { SearchBox } from '../SearchBox/SearchBox';
import { CategorySelect, SortSelect } from '../SortSelect/SortSelect';

interface FilterBarProps {
  params: CatalogParams;
  categories: string[];
  onSearch: (q: string) => void;
  onCategoryChange: (category: string | null) => void;
  onSortChange: (sort: SortKey) => void;
}

/**
 * Search is always visible. Category and sort sit in a disclosure below `md` (a button with
 * aria-expanded, not a modal, so there is no focus trap) and inline from `md` up.
 */
export function FilterBar({
  params,
  categories,
  onSearch,
  onCategoryChange,
  onSortChange,
}: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const activeFilters = (params.category ? 1 : 0) + (params.sort === 'name-asc' ? 0 : 1);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      <SearchBox value={params.q} onSearch={onSearch} />
      <Button
        variant="secondary"
        className="md:hidden"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        Filters{activeFilters > 0 ? ` (${activeFilters})` : ''}
      </Button>
      <div
        id={panelId}
        className={clsx(
          'grid gap-3 sm:grid-cols-2 md:flex md:w-auto md:gap-3',
          open ? 'grid' : 'hidden md:flex',
        )}
      >
        <CategorySelect
          value={params.category}
          categories={categories}
          onChange={onCategoryChange}
        />
        <SortSelect value={params.sort} onChange={onSortChange} />
      </div>
    </div>
  );
}
