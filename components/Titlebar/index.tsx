import { h } from "preact";
import style from "./Titlebar.module.css";
import { IconType } from "react-icons";
import { FaRegSquare, FaWindowMinimize, FaX } from "react-icons/fa6";
import { memo } from "preact/compat";
import { Lumber } from "@/lib/log/Lumber";

type Props = {
  title: string;
  icon: IconType;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
};

/**
 * Titlebar. Shows app icon and window controls. Can be used to drag window
 */
export const Titlebar = memo(
  ({ title, icon, minimize, maximize, close }: Props) => {
    Lumber.log(Lumber.RENDER, "TITLEBAR RENDER");

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
