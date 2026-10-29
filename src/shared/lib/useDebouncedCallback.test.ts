import { act, renderHook } from '@testing-library/react';
import { useDebouncedCallback } from './useDebouncedCallback';

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls once with the latest arguments after the delay', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 250));

    act(() => {
      result.current.run('s');
      result.current.run('sh');
      result.current.run('shirt');
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('shirt');
  });

  it('flush runs immediately, and is a no-op when nothing is pending', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 250));
    act(() => {
      result.current.flush();
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      result.current.run('now');
      result.current.flush();
    });
    expect(callback).toHaveBeenCalledWith('now');
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cancel and unmount drop pending calls', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 100));
    act(() => {
      result.current.run('a');
      result.current.cancel();
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.run('b');
    });
    unmount();
    vi.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();
  });

  it('uses the latest callback without resetting the timer', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ cb }) => useDebouncedCallback(cb, 100), {
      initialProps: { cb: first },
    });
    act(() => {
      result.current.run('x');
    });
    rerender({ cb: second });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('x');
  });
});
