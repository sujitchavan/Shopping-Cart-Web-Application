import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { RouteErrorPage } from '@/pages/RouteErrorPage/RouteErrorPage';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('kaboom with internal details');
}

describe('error boundaries', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('ErrorBoundary shows a generic message, logs details and offers a reload', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
    expect(screen.queryByText(/kaboom/)).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      '[storefront] Unhandled render error',
      expect.anything(),
    );
  });

  it('ErrorBoundary renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('fine')).toBeInTheDocument();
  });

  it('RouteErrorPage handles errors thrown inside a route', async () => {
    const router = createMemoryRouter([
      { path: '/', Component: Boom, errorElement: <RouteErrorPage /> },
    ]);
    render(<RouterProvider router={router} />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/kaboom/)).toBeNull();
    expect(console.error).toHaveBeenCalledWith('[storefront] Route error', expect.any(Error));
  });
});
