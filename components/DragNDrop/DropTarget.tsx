import { DragStore } from "@/lib/components/DragNDrop/DragTarget";
import style from "./DragNDrop.module.css";
import { Lumber } from "@/lib/log/Lumber";
import { h } from "preact";
import { HTMLAttributes, memo, TargetedEvent } from "preact/compat";
import { useCallback } from "preact/hooks";

type Props =
  & {
    accept: string | string[];
    onDrop?: (
      ev: TargetedEvent<HTMLDivElement, DragEvent>,
      data?: any,
    ) => void;
    onDragEnter?: (
      ev: TargetedEvent<HTMLDivElement, DragEvent>,
      data?: any,
      ghost?: HTMLDivElement,
    ) => void;
    onDragOver?: (
      ev: TargetedEvent<HTMLDivElement, DragEvent>,
      data?: any,
      ghost?: HTMLDivElement,
    ) => void;
    onDragLeave?: (
      ev: TargetedEvent<HTMLDivElement, DragEvent>,
      data?: any,
      ghost?: HTMLDivElement,
    ) => void;
  }
  & Omit<
    HTMLAttributes<HTMLDivElement>,
    "onDrop" | "onDragOver" | "onDragEnter" | "onDragLeave"
  >;

const getDataFromEvent = (
  event: TargetedEvent<HTMLDivElement, DragEvent>,
) => {
  const id = +event.dataTransfer?.types.find((t) => t.startsWith("data-"))!
    .split("-")[1]!;
  return DragStore.get().context.data.get(id);
};

const getGhostFromEvent = (
  event: TargetedEvent<HTMLDivElement, DragEvent>,
) => {
  const id = +event.dataTransfer?.types.find((t) => t.startsWith("ghost-"))!
    .split("-")[1]!;
  return DragStore.get().context.ghostElements.get(id);
};

export namespace DropTarget {
  export type Props = Parameters<typeof DropTarget>[0];
}

export const DropTarget = memo((
  { accept, onDragEnter, onDragOver, onDrop, onDragLeave, ...attr }: Props,
) => {
  Lumber.log(Lumber.RENDER, "DROP TARGET RENDER");

  const shouldAccept = useCallback((types?: readonly string[]) => {
    if (!types) return false;
    const valid = typeof accept == "string" ? [accept] : accept;
    return valid.some((v) => types.includes(v));
  }, [accept]);

  return (
    <div
      {...attr}
      style-drop-target=""
      class={style.droptarget + " " + (attr.className ?? attr.class ?? "")}
      onDragEnter={(e) => {
        if (shouldAccept(e.dataTransfer?.types)) e.preventDefault();
        const ghost = getGhostFromEvent(e);
        const data = getDataFromEvent(e);
        onDragEnter?.(e, data, ghost);
      }}
      onDragOver={(e) => {
        if (shouldAccept(e.dataTransfer?.types)) e.preventDefault();
        const ghost = getGhostFromEvent(e);
        const data = getDataFromEvent(e);
        onDragOver?.(e, data, ghost);
      }}
      onDragLeave={(e) => {
        if (shouldAccept(e.dataTransfer?.types)) e.preventDefault();
        const ghost = getGhostFromEvent(e);
        const data = getDataFromEvent(e);
        onDragLeave?.(e, data, ghost);
      }}
      onDrop={(e) => {
        const data = getDataFromEvent(e);
        onDrop?.(e, data);
      }}
    >
    </div>
  );
});
