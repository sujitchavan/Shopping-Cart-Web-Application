/**
 * Money is always held as integer cents. Floats only exist at the API boundary (`toCents`) and in
 * the formatter, so totals can never drift (0.1 + 0.2 problems stay out of the cart).
 */
export type Cents = number;

const CURRENCY = 'USD';
const LOCALE = 'en-US';

const formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });

/** Converts a decimal amount (e.g. 19.99) to integer cents (1999) without float rounding errors. */
export function toCents(amount: number): Cents {
  // Shifting the decimal point in the string form avoids cases like 1.005 * 100 = 100.4999…
  const shifted = Number(`${amount}e2`);
  return Math.round(Number.isFinite(shifted) ? shifted : amount * 100);
}

export function multiplyCents(unit: Cents, quantity: number): Cents {
  return unit * quantity;
}

export function sumCents(values: Iterable<Cents>): Cents {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

export function formatCents(cents: Cents): string {
  return formatter.format(cents / 100);
}
