import { clsx } from 'clsx';
import { useId, useState } from 'react';
import { Button } from '@/shared/ui';
import type { CatalogParams } from '../../hooks/useCatalogParams';
import { DEFAULT_SORT, type SortKey } from '../../model/types';
import { CategoryChips } from '../CategoryChips/CategoryChips';
import { SearchBox } from '../SearchBox/SearchBox';
import { SortSelect } from '../SortSelect/SortSelect';

interface FilterBarProps {
  params: CatalogParams;
  categories: string[];
  onSearch: (q: string) => void;
  onCategoriesChange: (categories: string[]) => void;
  onSortChange: (sort: SortKey) => void;
}

/**
 * Search and the category chips are always visible. Sort sits in a disclosure below `md` (a button
 * with aria-expanded, not a modal, so there is no focus trap) and inline from `md` up.
 */
export function FilterBar({
  params,
  categories,
  onSearch,
  onCategoriesChange,
  onSortChange,
}: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const sortChanged = params.sort !== DEFAULT_SORT;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <SearchBox value={params.q} onSearch={onSearch} />
        <Button
          variant="secondary"
          className="md:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          Sort{sortChanged ? ' (1)' : ''}
        </Button>
        <div id={panelId} className={clsx('md:block md:w-auto', open ? 'block' : 'hidden')}>
          <SortSelect value={params.sort} onChange={onSortChange} />
        </div>
      </div>
      <CategoryChips
        categories={categories}
        selected={params.categories}
        onChange={onCategoriesChange}
      />
    </div>
  );
}
