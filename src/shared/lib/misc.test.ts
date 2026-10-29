import { logger } from './logger';
import { pluralize } from './pluralize';

describe('pluralize', () => {
  it.each([
    [0, '0 items'],
    [1, '1 item'],
    [2, '2 items'],
  ])('%d → %s', (count, expected) => {
    expect(pluralize(count, 'item')).toBe(expected);
  });

  it('accepts an irregular plural', () => {
    expect(pluralize(2, 'box', 'boxes')).toBe('2 boxes');
  });
});

describe('logger', () => {
  it('prefixes messages and passes details through', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logger.warn('careful');
    logger.error('broken', { code: 1 });
    expect(warn).toHaveBeenCalledWith('[storefront] careful');
    expect(error).toHaveBeenCalledWith('[storefront] broken', { code: 1 });
  });
});
