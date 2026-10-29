import { parseProductList, type Product } from '@/features/catalog';
import rawProducts from './products.json';

/** The raw API payload (what MSW serves). */
export const rawCatalog: unknown[] = rawProducts;

/** The same payload after the schema boundary (what the app works with). */
export function parsedCatalog(): Product[] {
  const result = parseProductList(rawProducts);
  if (!result.ok) throw new Error('Fixture catalogue is invalid');
  return result.products;
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    title: 'Test Product',
    description: '',
    category: 'testing',
    image: 'https://fakestoreapi.com/img/test.jpg',
    rating: { rate: 4, count: 10 },
    priceCents: 1000,
    ...overrides,
  };
}
