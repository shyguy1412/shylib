import { useMemo } from "preact/hooks";

/**
 * Shortcut for a memoised value that wont ever change
 * useful for object props that would be detected as changed otherwise
 * @param constant
 * @returns
 */
export function useConstant<T>(constant: T) {
  return useMemo(() => constant, []);
}
