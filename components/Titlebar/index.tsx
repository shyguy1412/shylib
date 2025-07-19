import { h } from "preact";
import style from "./Titlebar.module.css";
import { IconType } from "react-icons";
import { FaRegSquare, FaWindowMinimize, FaX } from "react-icons/fa6";
import { memo, useEffect, useState } from "preact/compat";
import { Lumber } from "@/lib/log/Lumber";
import { createAtom } from "@xstate/store";
import { useAtom } from "@/lib/hooks";

type Props = {
  title: string;
  icon: IconType;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
};

const isFullscreenAtom = createAtom(await fullscreen.isFullscreen());

fullscreen.onEnterFullscreen(() => isFullscreenAtom.set(true));
fullscreen.onLeaveFullscreen(() => isFullscreenAtom.set(false));

/**
 * Titlebar. Shows app icon and window controls. Can be used to drag window
 */
export const Titlebar = memo(
  ({ title, icon, minimize, maximize, close }: Props) => {
    Lumber.log(Lumber.RENDER, "TITLEBAR RENDER");

    const [isFullscreen] = useAtom(isFullscreenAtom);

    if (isFullscreen) return undefined;

    return (
      <div class={style.titlebar} style-titlebar="">
        <div style-titlebar-icon="">
          {h(icon, {})}
        </div>

        <div style-titlebar-title="">
          {title}
        </div>

        <div style-titlebar-controls="">
          <div
            style-titlebar-controls-minimize=""
            onClick={(_) => minimize()}
          >
            <FaWindowMinimize />
          </div>

          <div
            style-titlebar-controls-maximise=""
            onClick={(_) => maximize()}
          >
            <FaRegSquare />
          </div>

          <div
            style-titlebar-controls-close=""
            onClick={(_) => close()}
          >
            <FaX />
          </div>
        </div>
      </div>
    );
  },
);
