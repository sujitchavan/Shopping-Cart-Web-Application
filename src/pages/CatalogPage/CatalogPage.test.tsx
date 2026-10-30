import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { PLACEHOLDER_IMAGE } from '@/shared/lib/safeUrl';
import { PRODUCTS_URL, productsFailWith, productsReturn } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderWithProviders';

const productList = () => screen.findByRole('list', { name: 'Products' });
const productTitles = () =>
  within(screen.getByRole('list', { name: 'Products' }))
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);

describe('Catalog page', () => {
  it('shows a skeleton, then the first page of products', async () => {
    renderApp();
    expect(await screen.findByTestId('product-grid-skeleton')).toHaveAttribute('aria-busy', 'true');

    const list = await productList();
    expect(within(list).getAllByRole('listitem')).toHaveLength(12);
    expect(screen.getByText('Showing 1–12 of 14')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'All products' })).toBeInTheDocument();
  });

  it('shows the empty-catalogue state for []', async () => {
    server.use(productsReturn([]));
    renderApp();
    expect(
      await screen.findByRole('heading', { name: 'No products available right now' }),
    ).toBeInTheDocument();
  });

  it('shows an error after retries, then recovers on Retry', async () => {
    server.use(productsFailWith(500));
    const { user } = renderApp();

    const heading = await screen.findByRole('heading', { name: "We couldn't load products" });
    await waitFor(() => expect(heading).toHaveFocus());

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await productList()).toBeInTheDocument();
  });

  it('renders the valid products when one item in the payload is malformed', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    server.use(
      http.get(PRODUCTS_URL, () =>
        HttpResponse.json([
          {
            id: 1,
            title: '<b>Bold</b> Hat',
            price: 10,
            category: 'hats',
            image: 'javascript:alert(1)',
          },
          { id: 2, title: 'Broken', price: 'abc', category: 'hats', image: '' },
        ]),
      ),
    );
    renderApp();
    await productList();
    expect(productTitles()).toEqual(['<b>Bold</b> Hat']);
    expect(document.querySelector('b')).toBeNull();
    const image = within(screen.getByRole('list', { name: 'Products' })).getByRole('presentation');
    expect(image).toHaveAttribute('src', PLACEHOLDER_IMAGE);
    expect(screen.getByText('No ratings')).toBeInTheDocument();
  });

  it('filters by category, searches and sorts through the UI (URL-driven)', async () => {
    const { user, router } = renderApp();
    await productList();

    await user.selectOptions(screen.getByLabelText('Category'), 'electronics');
    await waitFor(() => expect(productTitles()).toHaveLength(4));
    expect(router.state.location.search).toBe('?category=electronics');

    await user.type(screen.getByLabelText('Search products'), 'SSD');
    await waitFor(() => expect(productTitles()).toHaveLength(2));

    await user.selectOptions(screen.getByLabelText('Sort by'), 'price-desc');
    await waitFor(() =>
      expect(productTitles()).toEqual(['SanDisk SSD PLUS 1TB', 'Silicon Power 256GB SSD']),
    );
    expect(router.state.location.search).toBe('?category=electronics&q=SSD&sort=price-desc');
  });

  it('shows a distinct no-matches state with Clear filters', async () => {
    const { user } = renderApp({ route: '/?q=zzzz&category=jewelery' });
    expect(await screen.findByText('No products match "zzzz" in jewelery.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(productTitles()).toHaveLength(12));
    expect(screen.getByLabelText('Search products')).toHaveValue('');
  });

  it('falls back to defaults for invalid URL params', async () => {
    renderApp({ route: '/?sort=evil&page=-4&category=nope' });
    await productList();
    expect(screen.getByLabelText('Sort by')).toHaveValue('name-asc');
    expect(screen.getByLabelText('Category')).toHaveValue('');
    expect(productTitles()[0]).toBe('Acer SB220Q 21.5 inch Monitor');
  });

  it('paginates with links and moves focus to the results heading', async () => {
    const { user, router } = renderApp();
    await productList();

    const pagination = screen.getByRole('navigation', { name: 'Pagination' });
    expect(within(pagination).getByRole('link', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(within(pagination).getByRole('link', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Showing 13–14 of 14')).toBeInTheDocument());
    expect(router.state.location.search).toBe('?page=2');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Results' })).toHaveFocus());
  });

  it('clamps a page beyond the last page', async () => {
    renderApp({ route: '/?page=9' });
    await productList();
    expect(screen.getByText('Showing 13–14 of 14')).toBeInTheDocument();
  });

  it('toggles the mobile filter disclosure', async () => {
    const { user } = renderApp();
    await productList();
    const toggle = screen.getByRole('button', { name: 'Filters' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
