export type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/** First, last, current ±1, with ellipses; at most 7 slots so it fits a phone. */
export function getPageItems(current: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const start = Math.max(2, Math.min(current - 1, pageCount - 4));
  const end = Math.min(pageCount - 1, Math.max(current + 1, 5));
  const items: PageItem[] = [1];
  if (start > 2) items.push('ellipsis-start');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < pageCount - 1) items.push('ellipsis-end');
  items.push(pageCount);
  return items;
}
