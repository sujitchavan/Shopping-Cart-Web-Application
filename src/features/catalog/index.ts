// Public API of the catalog feature. Other modules import from here, never from internals.
export { catalogApi, useGetCatalogPageQuery, useGetProductsQuery } from './api/catalogApi';
export {
  parseProductList,
  ProductSchema,
  type Product,
  type ProductRating,
} from './api/productSchema';

export { FilterBar } from './components/FilterBar/FilterBar';
export { Pagination } from './components/Pagination/Pagination';
export { ProductGrid } from './components/ProductGrid/ProductGrid';
export { ProductGridSkeleton } from './components/ProductGridSkeleton/ProductGridSkeleton';

export { useCatalog } from './hooks/useCatalog';
export { useCatalogParams, type CatalogParams } from './hooks/useCatalogParams';

export { buildCatalogPage } from './model/filterSort';
export {
  DEFAULT_SORT,
  PAGE_SIZE,
  SORT_KEYS,
  SORT_LABELS,
  type CatalogPage,
  type CatalogQuery,
  type SortKey,
} from './model/types';
