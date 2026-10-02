// Checks for the demo checkout. Format only: no card is ever charged or stored.

// Any 16 digits. A real checkout would also run the Luhn checksum, but this is a stand-in
// and a demo should not reject whatever number the person happens to type.
export const cardNumberValid = (number) => /^\d{16}$/.test((number || '').replace(/\s/g, ''));

// 'MM/YY', valid through the last day of that month.
export const expiryValid = (expiry, now = new Date()) => {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry || '');
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  return new Date(year, month, 1) > now;
};
