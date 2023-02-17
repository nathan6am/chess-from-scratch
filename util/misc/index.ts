export function coinflip<T, U = T>(a: T | U, b: T | U): T | U {
  return Math.random() < 0.5 ? a : b;
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function escapeSpecialChars(string: string): string {
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export const removeUndefinedFields = (obj: any) => {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
};

import type * as React from "react";

export function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>
): React.RefCallback<T> {
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
