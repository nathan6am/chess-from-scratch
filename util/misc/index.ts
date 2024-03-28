/**
 * Returns a coin flip of supplied args
 * @param a option a
 * @param b option b
 * @returns either a or b
 */
export function coinflip<T, U = T>(a: T | U, b: T | U): T | U {
  return Math.random() < 0.5 ? a : b;
}

/**
 * Checks if a value is not null or undefined
 * @param value
 * @returns boolean
 */
export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Clean up a string by escaping special characters
 * @param string raw string
 * @returns string with special characters escaped
 */
export function escapeSpecialChars(string: string): string {
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Removes undefined fields from an object for JSON serialization
 * @param object object to clean
 * @returns {{ [key: string]: any }} object with undefined fields removed
 */
export function removeUndefinedFields(object: { [key: string]: any }): { [key: string]: any } {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

/**
 * Merges multiple refs into a single ref callback
 * @param refs array of refs
 * @returns ref callback
 */
export function mergeRefs<T = any>(refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}
