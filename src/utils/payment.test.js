import { describe, it, expect } from 'vitest';
import { cardNumberValid, expiryValid } from './payment';

describe('cardNumberValid', () => {
  it('accepts any 16 digits, with or without spaces', () => {
    expect(cardNumberValid('4242 4242 4242 4242')).toBe(true);
    expect(cardNumberValid('4534 3243 4343 4523')).toBe(true);
    expect(cardNumberValid('1234567812345678')).toBe(true);
  });

  it('rejects the wrong length and non-digits', () => {
    expect(cardNumberValid('4242 4242 4242')).toBe(false);
    expect(cardNumberValid('4242 4242 4242 42ab')).toBe(false);
    expect(cardNumberValid('')).toBe(false);
  });
});

describe('expiryValid', () => {
  const now = new Date(2026, 9, 2); // 2 Oct 2026

  it('is valid through the end of the stated month', () => {
    expect(expiryValid('10/26', now)).toBe(true);
    expect(expiryValid('09/26', now)).toBe(false);
    expect(expiryValid('01/30', now)).toBe(true);
  });

  it('rejects impossible months and bad formats', () => {
    expect(expiryValid('13/30', now)).toBe(false);
    expect(expiryValid('00/30', now)).toBe(false);
    expect(expiryValid('1/30', now)).toBe(false);
    expect(expiryValid(null, now)).toBe(false);
  });
});
