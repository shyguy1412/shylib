import { ComponentChild, h } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

/**
 * Create an async component that can be logical or'd with a default/loading screen
 * 
 * 
 * @param promise Promise that resolves to the props of the async component
 * @param component async component
 * @param deps dependencies to memo component
 * @returns null or the rendered component
 */
export function useAsync<
  P extends Promise<any>,
  V = P extends Promise<infer V> ? V : never
>(promise: P, component: (props: V) => h.JSX.Element, deps?: any[]) {

  const componentMemo = useCallback(component, [...deps??[Symbol()]]);
  const [View, setView] = useState<ComponentChild | null>(null);

  useEffect(() => {
    setView(null);
    promise.then((props) => {
      setView(
        h(componentMemo, props)
      );
    }
    );
  }, [promise, componentMemo]);

  return View;
};