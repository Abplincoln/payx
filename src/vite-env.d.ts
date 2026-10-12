/// <reference types="vite/client" />

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: <T = unknown>(args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<T>;
    on?: (eventName: string, handler: (...args: unknown[]) => void) => void;
    removeListener?: (eventName: string, handler: (...args: unknown[]) => void) => void;
  };
}
