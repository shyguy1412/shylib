import style from "./DragNDrop.module.css";
import { Lumber } from "@/lib/log/Lumber";
import { createStore } from "@xstate/store";
import { AnyComponent, h, render } from "preact";
import { HTMLAttributes, memo, TargetedEvent, useEffect } from "preact/compat";

type Props = {
  group: string;
  data: any;
  ghostElement?: AnyComponent | "native";
} & HTMLAttributes<HTMLDivElement>;

export const DragStore = createStore({
  context: {
    ghostElements: new Map<number, HTMLDivElement>(),
    data: new Map<number, any>(),
  },
  on: {
    addGhost: (context, event: { id: number; element: HTMLDivElement }) =>
      void context.ghostElements.set(event.id, event.element),
    removeGhost: (context, event: { id: number }) =>
      void context.ghostElements.delete(event.id),
    setData: (context, event: { id: number; data: any }) =>
      void context.data.set(event.id, event.data),
    removeData: (context, event: { id: number }) =>
      void context.data.delete(event.id),
  },
});

const createGhostElement = (
  ev: TargetedEvent<HTMLDivElement, DragEvent>,
  ghostElement?: AnyComponent | string,
) => {
  if (typeof ghostElement == "string") return;

  //hides the native ghost image
  ev.dataTransfer?.setDragImage(document.head, 0, 0);

  if (!ghostElement) return;

  const id = Math.random();
  ev.dataTransfer?.setData(`ghost-${id}`, "");

  const ghostImageElement = document.createElement("div");
  ghostImageElement.className = style.ghostimage;

  render(h(ghostElement, {}), ghostImageElement);
  document.body.append(ghostImageElement);

  DragStore.trigger.addGhost({ id, element: ghostImageElement });

  const boundingBox = ev.currentTarget.getBoundingClientRect();

  const offset = {
    x: boundingBox.x - ev.clientX,
    y: boundingBox.y - ev.clientY,
  };

  const controller = new AbortController();

  ghostImageElement.setAttribute("data-pos-x", (ev.clientX + offset.x) + "");
  ghostImageElement.setAttribute("data-pos-y", (ev.clientY + offset.y) + "");

  window.addEventListener("drag", (ev) => {
    if (
      ev.clientX == 0 && ev.clientY == 0 && ev.movementX == 0 &&
      ev.movementY == 0
    ) return;

    ghostImageElement.setAttribute("data-pos-x", (ev.clientX + offset.x) + "");
    ghostImageElement.setAttribute("data-pos-y", (ev.clientY + offset.y) + "");
  }, { signal: controller.signal });

  window.addEventListener("dragend", () => {
    controller.abort();
    render(null, ghostImageElement);
    ghostImageElement.remove();
    DragStore.trigger.removeGhost({ id });
  }, { once: true });
};

export namespace DragTarget {
  export type Props = Parameters<typeof DragTarget>[0];
}
export const DragTarget = memo(
  ({ group, data, onDragStart, ghostElement, ...attr }: Props) => {
    Lumber.log(Lumber.RENDER, "DRAG TARGET RENDER");

    const id = Math.random();
    useEffect(() => {
      DragStore.trigger.setData({ id, data });
      return () => DragStore.trigger.removeData({ id });
    });

    return (
      <div
        class={style.dragtarget + " " + (attr.className ?? attr.class ?? "")}
        style-drag-target=""
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer?.setData(group, e.currentTarget.id);
          e.dataTransfer?.setData("data-" + id, "");
          createGhostElement(e, ghostElement);
          onDragStart?.(e);
        }}
        {...attr}
      >
      </div>
    );
  },
);
