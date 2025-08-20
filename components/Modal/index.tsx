import { ComponentChild, ComponentChildren, h, render } from "preact";
import { memo, useEffect, useMemo, useRef, useState } from "preact/compat";
import { Lumber } from "@/lib/log/Lumber";
import { Atom, createAtom } from "@xstate/store";
import { useAtom } from "@/lib/hooks";

namespace Modal {
  export type Props = {
    children?: ComponentChildren;
    open: Atom<unknown>;
  };
}

export interface Modal<T, P extends object = {}> {
  (props: {
    submit: (data: T) => void;
    abort: () => void;
  } & {
    [key in keyof P]: P[key];
  }): ComponentChild;
}

export function useModal<T, P extends object = {}>(Content: Modal<T, P>) {
  const openAtom = useMemo(() => createAtom<P | null>(null), []);
  const [open, setOpen] = useAtom(openAtom);
  const [data, setData] = useState<T>();

  useEffect(() => {
    if (!open) return;

    const root = document.createElement("div");
    document.body.appendChild(root);

    console.log({ open });

    render(<Modal open={openAtom}>
      <Content {...open} submit={setData} abort={() => openAtom.set(null)}></Content>
    </Modal>, root);

    return () => render(null, root);
  }, [open, openAtom, Content]);

  return {
    open: (props: P) => setOpen(props),
    close: () => setOpen(null),
    data
  };
}

const Modal = memo(({
  children,
  open
}: Modal.Props) => {
  Lumber.log(Lumber.RENDER, "MODAL RENDER");

  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName != "open") continue;
        if(!el.open)open.set(false);
        // open.set(el.open);
      }
    });

    observer.observe(ref.current, { attributes: true });

    return () => observer.disconnect();
  }, [open, ref]);

  useEffect(() => {
    if (!ref.current) return;

    if (open) ref.current.showModal();
    else ref.current.close();

  }, [open.get(), ref]);

  return <dialog style-modal="" ref={ref}>
    {children}
  </dialog>;
});

