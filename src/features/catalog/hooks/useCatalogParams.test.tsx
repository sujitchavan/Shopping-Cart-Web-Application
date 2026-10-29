import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { applyCatalogParams, parseCatalogParams, useCatalogParams } from './useCatalogParams';

const parse = (search: string) => parseCatalogParams(new URLSearchParams(search));

describe('parseCatalogParams', () => {
  it('returns defaults for an empty URL', () => {
    expect(parse('')).toEqual({ category: null, q: '', sort: 'name-asc', page: 1 });
  });

  it('reads valid values', () => {
    expect(parse('?category=electronics&q=ssd&sort=price-desc&page=2')).toEqual({
      category: 'electronics',
      q: 'ssd',
      sort: 'price-desc',
      page: 2,
    });
  });

  it.each([
    ['?sort=evil', { sort: 'name-asc' }],
    ['?page=-4', { page: 1 }],
    ['?page=abc', { page: 1 }],
    ['?page=2.5', { page: 1 }],
    ['?page=99999999', { page: 1 }],
    ['?category=', { category: null }],
    [`?category=${'x'.repeat(200)}`, { category: null }],
  ])('falls back to defaults for %s', (search, expected) => {
    expect(parse(search)).toMatchObject(expected);
  });

  it('caps the search query length', () => {
    expect(parse(`?q=${'a'.repeat(500)}`).q).toHaveLength(100);
  });
});

describe('applyCatalogParams', () => {
  const apply = (search: string, patch: Parameters<typeof applyCatalogParams>[1]) =>
    applyCatalogParams(new URLSearchParams(search), patch).toString();

  it('resets the page on any filter change', () => {
    expect(apply('q=a&page=3', { sort: 'price-asc' })).toBe('q=a&sort=price-asc');
  });

  it('omits default values', () => {
    expect(
      apply('sort=price-asc&category=jewelery&q=x', { sort: 'name-asc', category: null, q: '  ' }),
    ).toBe('');
  });

  it('writes an explicit page, omitting page 1', () => {
    expect(apply('q=a', { page: 2 })).toBe('q=a&page=2');
    expect(apply('q=a&page=2', { page: 1 })).toBe('q=a');
  });
});

describe('useCatalogParams', () => {
  function setup(initial = '/') {
    let location: ReturnType<typeof useLocation> | undefined;
    function LocationSpy({ children }: { children: ReactNode }) {
      location = useLocation();
      return children;
    }
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[initial]}>
        <LocationSpy>{children}</LocationSpy>
      </MemoryRouter>
    );
    const hook = renderHook(() => useCatalogParams(), { wrapper });
    return { ...hook, getSearch: () => location?.search };
  }

  it('updates the URL and parses it back', () => {
    const { result, getSearch } = setup('/?page=2');
    act(() => {
      result.current.setParams({ category: 'electronics' });
    });
    expect(getSearch()).toBe('?category=electronics');
    expect(result.current.params.category).toBe('electronics');
  });

  it('clearFilters removes category and query but keeps sort', () => {
    const { result, getSearch } = setup('/?category=jewelery&q=gold&sort=price-asc');
    act(() => {
      result.current.clearFilters();
    });
    expect(getSearch()).toBe('?sort=price-asc');
  });

  it('builds page hrefs that keep the other params', () => {
    const { result } = setup('/?q=ssd');
    expect(result.current.hrefForPage(3)).toBe('?q=ssd&page=3');
    expect(setup('/').result.current.hrefForPage(1)).toBe('?');
  });
});
