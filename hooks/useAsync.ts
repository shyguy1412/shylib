import { Dispatch, StateUpdater, useEffect, useMemo, useState } from 'preact/hooks';

export type AsyncState<V> = {
    resolved: false;
    value: undefined;
} | {
    resolved: true;
    value: V;
};

export function usePromise<V>(promise: Promise<V> | (() => Promise<V>)): AsyncState<V> {
    const [resolved, setResolved] = useState(false);
    const [value, setValue] = useState<V>();

    useEffect(() => {
        setValue(undefined);
        setResolved(false);
        (typeof promise == 'function' ? promise() : promise)
            .then(setValue)
            .then(() => setResolved(true));
    }, [promise]);

    return useMemo(
        () => resolved ? { resolved, value: value! } : { resolved, value: undefined },
        [resolved],
    );
}

/**
 * useState for promises
 * @returns
 */
export function useAsync<V>(initial: Promise<V> | (() => Promise<V>)): [
    AsyncState<V>,
    Dispatch<StateUpdater<Promise<Awaited<V>>>>,
] {
    const [promise, setPromise] = useState(() => {
        const initialPromise = typeof initial == 'function' ? initial() : initial;
        return Promise.resolve(initialPromise);
    });

    const state = usePromise(promise);

    return [state, setPromise];
}
