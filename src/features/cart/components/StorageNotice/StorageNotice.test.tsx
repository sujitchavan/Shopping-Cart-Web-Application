import { act, render, screen } from '@testing-library/react';
import { createSafeStorage } from '@/shared/lib/safeStorage';
import { StorageNotice } from './StorageNotice';

describe('StorageNotice', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('renders nothing while storage works', () => {
    const { container } = render(
      <StorageNotice storage={createSafeStorage(() => window.localStorage)} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('appears as soon as a write fails (quota exceeded)', () => {
    const storage = createSafeStorage(
      () =>
        ({
          getItem: () => null,
          setItem: () => {
            throw new DOMException('full', 'QuotaExceededError');
          },
          removeItem: () => undefined,
        }) as unknown as Storage,
    );
    render(<StorageNotice storage={storage} />);
    expect(screen.queryByRole('status')).toBeNull();

    act(() => {
      storage.set('k', 'v');
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      "Your cart won't be saved on this device.",
    );
  });

  it('shows immediately when storage is blocked', () => {
    const blocked = createSafeStorage(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    render(<StorageNotice storage={blocked} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
