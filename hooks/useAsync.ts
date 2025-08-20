import { Dispatch, StateUpdater, useEffect, useState } from "preact/hooks";

type AsyncState<V> = {
  resolved: false,
  value: undefined;
} | {
  resolved: true,
  value: V;
};


/**
 * useState for promises
 * @returns 
 */
export function useAsync<V>(initialPromise?: Promise<V>): [
  AsyncState<V>, Dispatch<StateUpdater<Promise<Awaited<V> | undefined>>>
] {

  const [promise, setPromise] = useState(Promise.resolve(initialPromise));
  const [value, setValue] = useState<V>();
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    setValue(undefined);
    setResolved(false);
    promise.then(setValue).then(() => setResolved(true));
  }, [promise]);

  if (resolved) return [{
    resolved,
    value: value!,
  }, setPromise];
  else return [{
    resolved,
    value: undefined,
  }, setPromise];
};