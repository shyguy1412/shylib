import { Atom } from "@xstate/store";
import { useSelector } from "@xstate/store/react";
import { Dispatch, StateUpdater, useCallback } from "preact/hooks";

export function useAtom<T>(atom: Atom<T>): [T, Dispatch<StateUpdater<T>>] {
  return [
    useSelector(atom, (value) => value),
    useCallback((updater) => {
      const newValue = typeof updater == "function"
        ? (updater as (state: T) => T)(atom.get())
        : updater;
      atom.set(newValue);
    }, [atom]),
  ];
}
