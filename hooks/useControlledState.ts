import { Atom, createAtom } from "@xstate/store";
import { useSelector } from "@xstate/store/react";
import {
  Dispatch,
  StateUpdater,
  useCallback,
  useEffect,
  useMemo,
} from "preact/hooks";

/**
 * Controlled state is state that can be controlled by other values
 * This allows for components to handle state internally aswell as parents being in controll
 *
 * @param producer a function that takes the dependencies and creates a state from them
 * @param dependencies the dependencies of the controlled state
 * @param updateEvent an update event used to propagate changes to the parent
 * @returns the controlled state and a dispatcher and the internal state atom
 */
export function useControlledState<S, D extends any[]>(
  producer: (...dependencies: D) => S,
  dependencies: D,
  updateEvent?: (newState: S) => void,
): [S, Dispatch<StateUpdater<S>>, Atom<S>] {
  const atom = useMemo(
    () => createAtom(producer(...dependencies)),
    dependencies,
  );

  const update = useCallback((newState: StateUpdater<S>) => {
    const current = atom.get();
    const computedState = typeof newState == "function"
      // @ts-ignore ts appearently thinks functions arent callable
      ? newState(current) as S
      : newState;
    updateEvent?.(computedState);
    atom.set(computedState);
  }, [atom, updateEvent]);

  return [
    useSelector(atom, (atom) => atom),
    update,
    atom,
  ];
}
