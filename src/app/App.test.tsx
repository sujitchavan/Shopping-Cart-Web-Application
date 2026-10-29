import { render, screen, waitFor } from '@testing-library/react';
import { createTestStore, renderApp } from '@/test/renderWithProviders';
import { App } from './App';

describe('App shell', () => {
  it('renders landmarks, a skip link and a cart link', async () => {
    renderApp();
    await screen.findByRole('list', { name: 'Products' });
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('moves focus to the new page heading after navigation', async () => {
    const { user } = renderApp();
    await screen.findByRole('list', { name: 'Products' });

    await user.click(screen.getByRole('link', { name: /^Cart, / }));
    const heading = await screen.findByRole('heading', { level: 1, name: 'Your cart' });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it('shows a not-found page for unknown routes', async () => {
    renderApp({ route: '/nope' });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to products' })).toHaveAttribute('href', '/');
  });

  it('boots through the production App component with a browser router', async () => {
    render(<App store={createTestStore()} />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'All products' }),
    ).toBeInTheDocument();
  });
});
