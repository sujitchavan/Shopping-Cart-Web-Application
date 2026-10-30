import { clsx } from 'clsx';
import { normalizeCategories, toggleCategory } from '../../model/filterSort';

interface CategoryChipsProps {
  /** Every category in the catalogue. */
  categories: string[];
  /** Empty means all. */
  selected: string[];
  onChange: (categories: string[]) => void;
}

const chipClassName =
  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm ' +
  'font-medium capitalize select-none transition-colors motion-reduce:transition-none';

// Colours live only in these two, and a chip gets exactly one: utilities for the same property
// win by stylesheet order, not class order, so mixing them is unpredictable.
const unselectedClassName = 'border-line-strong bg-surface text-ink hover:bg-surface-muted';
const selectedClassName = 'border-accent bg-accent text-on-accent hover:bg-accent-hover';

// The checkbox is visually hidden, so the chip shows its focus ring.
const focusRingClassName =
  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ' +
  'has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-focus';

/**
 * Real checkboxes styled as chips, inside a fieldset, so each one reads as "electronics, checkbox,
 * checked" and toggles with Space. "All" is a toggle button that clears the selection.
 */
export function CategoryChips({ categories, selected, onChange }: CategoryChipsProps) {
  if (categories.length === 0) return null;
  const all = selected.length === 0;

  return (
    <fieldset>
      {/* Hidden visually, but still names the group for screen readers. */}
      <legend className="sr-only">Category</legend>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={all}
          onClick={() => {
            if (!all) onChange([]);
          }}
          className={clsx(chipClassName, all ? selectedClassName : unselectedClassName)}
        >
          All
        </button>
        {categories.map((category) => {
          const checked = selected.includes(category);
          return (
            <label
              key={category}
              className={clsx(
                chipClassName,
                focusRingClassName,
                checked ? selectedClassName : unselectedClassName,
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() =>
                  onChange(normalizeCategories(toggleCategory(selected, category), categories))
                }
              />
              {checked && <span aria-hidden="true">✓</span>}
              {category}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
