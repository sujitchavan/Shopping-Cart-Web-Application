import { announce, subscribeToAnnouncements } from './announce';

describe('announce', () => {
  it('delivers trimmed messages with increasing ids and the requested politeness', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAnnouncements(listener);

    announce('  Added Jacket  ');
    announce('Error!', 'assertive');

    expect(listener).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ message: 'Added Jacket', politeness: 'polite' }),
    );
    expect(listener).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ message: 'Error!', politeness: 'assertive' }),
    );
    const [[first], [second]] = listener.mock.calls as [[{ id: number }], [{ id: number }]];
    expect(second.id).toBeGreaterThan(first.id);
    unsubscribe();
  });

  it('ignores blank messages and stops after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAnnouncements(listener);
    announce('   ');
    unsubscribe();
    announce('Hello');
    expect(listener).not.toHaveBeenCalled();
  });
});
