import { formatCents, multiplyCents, sumCents, toCents } from './money';

describe('toCents', () => {
  it.each([
    [19.99, 1999],
    [0, 0],
    [109.95, 10995],
    [1.005, 101],
    [0.1 + 0.2, 30],
    [695, 69500],
    [1e-7, 0],
  ])('converts %d to %d cents', (amount, cents) => {
    expect(toCents(amount)).toBe(cents);
  });
});

describe('cent arithmetic', () => {
  it('3 × $19.99 is exactly $59.97', () => {
    expect(multiplyCents(toCents(19.99), 3)).toBe(5997);
    expect(formatCents(multiplyCents(toCents(19.99), 3))).toBe('$59.97');
  });

  it('summing 100 lines does not drift', () => {
    const lines = Array.from({ length: 100 }, () => toCents(0.1));
    expect(sumCents(lines)).toBe(1000);
    expect(formatCents(sumCents(lines))).toBe('$10.00');
  });

  it('sums an empty list to zero', () => {
    expect(sumCents([])).toBe(0);
  });
});

describe('formatCents', () => {
  it('formats USD with thousands separators', () => {
    expect(formatCents(123456789)).toBe('$1,234,567.89');
  });
});
