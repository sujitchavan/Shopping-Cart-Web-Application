import { clsx } from 'clsx';
import { Link } from 'react-router';
import { buttonClassName } from '@/shared/ui';
import { getPageItems } from './pageItems';

interface PaginationProps {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
}

/** Real links: shareable, open-in-new-tab works, and the back button walks through pages. */
export function Pagination({ page, pageCount, hrefForPage }: PaginationProps) {
  if (pageCount <= 1) return null;
  const linkClass = buttonClassName({ variant: 'secondary', size: 'sm' });

  return (
    <nav aria-label="Pagination" className="flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {page > 1 ? (
            <Link to={hrefForPage(page - 1)} className={linkClass}>
              <span aria-hidden="true">‹</span> Previous
            </Link>
          ) : (
            <span aria-disabled="true" className={clsx(linkClass, 'opacity-50')}>
              <span aria-hidden="true">‹</span> Previous
            </span>
          )}
        </li>
        {getPageItems(page, pageCount).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <Link
                to={hrefForPage(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
                className={buttonClassName({
                  variant: item === page ? 'primary' : 'secondary',
                  size: 'icon',
                })}
              >
                {item}
              </Link>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="px-1 text-ink-muted">
              …
            </li>
          ),
        )}
        <li>
          {page < pageCount ? (
            <Link to={hrefForPage(page + 1)} className={linkClass}>
              Next <span aria-hidden="true">›</span>
            </Link>
          ) : (
            <span aria-disabled="true" className={clsx(linkClass, 'opacity-50')}>
              Next <span aria-hidden="true">›</span>
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
