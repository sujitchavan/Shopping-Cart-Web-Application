import { useId } from 'react';
import { SORT_KEYS, SORT_LABELS, type SortKey } from '../../model/types';

const selectClassName = 'border-line-strong bg-surface min-h-11 w-full rounded-lg border px-3';

export function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (sort: SortKey) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        Sort by
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const next = SORT_KEYS.find((key) => key === event.target.value);
          if (next) onChange(next);
        }}
        className={selectClassName}
      >
        {SORT_KEYS.map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>
    </div>
  );
}
