import _ from "lodash";
import { useState, useMemo, useCallback } from "react";
export interface SetHook<T> {
  values: T[];
  has: (value: T) => boolean;
  add: (value: T) => void;
  remove: (value: T) => void;
  addMany: (values: T[]) => void;
  removeMany: (values: T[]) => void;
  filter: (predicate: (value: T) => boolean) => void;
}
export default function useSet<T>(initialSet: Set<T> | Array<T>): SetHook<T> {
  const [set, updateSet] = useState(new Set(initialSet));
  const values = useMemo(() => {
    return Array.from(set);
  }, [set, set.values()]);
  const has = useCallback(
    (value: T) => {
      return set.has(value);
    },
    [set]
  );
  const add = useCallback(
    (value: T) => {
      set.add(value);
    },
    [set]
  );
  const remove = useCallback(
    (value: T) => {
      set.delete(value);
    },
    [set]
  );

  const filter = useCallback(
    (predicate: (value: T) => boolean) => {
      set.forEach((value) => {
        if (!predicate(value)) {
          set.delete(value);
        }
      });
    },
    [set]
  );

  const addMany = useCallback(
    (values: T[]) => {
      values.forEach((value) => {
        set.add(value);
      });
    },
    [set]
  );

  const removeMany = useCallback(
    (values: T[]) => {
      values.forEach((value) => {
        set.delete(value);
      });
    },
    [set]
  );
  return {
    values,
    has,
    add,
    remove,
    addMany,
    removeMany,
    filter,
  };
}
