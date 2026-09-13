export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isFilled = (v) => typeof v === 'string' && v.trim().length > 0;

export const isEmail = (v) => typeof v === 'string' && EMAIL.test(v.trim());

/** Whole-dollar amount from input like "$1,250"; NaN unless it is a whole, non-negative number. */
export function parseAmount(input) {
  const cleaned = String(input ?? '').replace(/[$,\s]/g, '');
  return /^\d+$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

export const isValidAmount = (n) => Number.isInteger(n) && n >= 5 && n <= 100_000;

/** US phone: 10 digits, or 11 starting with 1, after removing every non-digit. */
export function isUsPhone(v) {
  const digits = String(v ?? '').replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatUSD = (n) => usd.format(n);
