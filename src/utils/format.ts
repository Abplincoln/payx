export function formatBOT(amount: number): string {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} BOT`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatWallet(address: string): string {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatTxHash(hash: string): string {
  if (!hash || hash.length < 16) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

// Basic 0x-prefixed hex address validation (no chain-specific checks yet)
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export function isDateValid(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function isFutureDate(dateStr: string): boolean {
  if (!isDateValid(dateStr)) return false;
  return new Date(dateStr) >= new Date(new Date().toDateString());
}
