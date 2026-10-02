export interface ValidationRule {
  required?: boolean;
  validator?: (value: string) => boolean;
  message: string;
}

export function validateField(value: string, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    if (rule.required && !value.trim()) {
      return rule.message;
    }
    if (value.trim() && rule.validator && !rule.validator(value)) {
      return rule.message;
    }
  }
  return null;
}

export function truncateAddress(address: string, startLen = 6, endLen = 4): string {
  if (!address || address.length <= startLen + endLen) return address;
  return `${address.slice(0, startLen)}…${address.slice(-endLen)}`;
}
