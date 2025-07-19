import { h } from "preact";
import style from "./Sidebar.module.css";
import { useCallback, useMemo } from "preact/hooks";
import { createRouter, Router, RouteTable, useRouter } from "@/lib/Router";
import { IconType } from "react-icons";
import { memo, PropsWithChildren, TargetedEvent } from "preact/compat";
import { Lumber } from "@/lib/log/Lumber";
import { useControlledState } from "@/lib/hooks";

export type Menu = {
  name: string;
  tooltip?: string;
  icon: IconType;
  menu: () => h.JSX.Element;
};

type Props = {
  menus: Menu[][];
  width?: number;
  onWidthChange?: (width: number) => void;
};

export const Sidebar = memo(({ menus, onWidthChange, ...props }: Props) => {
  Lumber.log(Lumber.RENDER, "SIDEBAR RENDER");

  const Router = useMemo(() => {
    const routes = menus.flat().reduce(
      (prev, cur) => (prev[cur.name] = cur.menu, prev),
      {} as RouteTable,
    );
    return createRouter(routes, menus[0]?.[0]?.name ?? "@None");
  }, [menus]);

  const { View, route } = useRouter(Router);

  const [width, setWidth] = useControlledState(
    (w) => w ?? 50,
    [props.width],
    onWidthChange,
  );

  const onMouseDown = useCallback(
    (event: TargetedEvent<HTMLDivElement, MouseEvent>) => {
      const controller = new AbortController();
      const { signal } = controller;
      const startX = event.clientX;
      const startWidth =
        event.currentTarget.previousElementSibling!.clientWidth;

      window.addEventListener("mousemove", (event: MouseEvent) => {
        setWidth(startWidth - (startX - event.clientX));
      }, { signal });

      window.addEventListener("mouseup", (event) => {
        document.body.style.cursor = "";
        controller.abort();
      }, { once: true });

      document.body.style.cursor = "e-resize";
    },
    [setWidth],
  );

  return (
    <div class={style.sidebar} style-sidebar="">
      <div style-sidebar-menu="">
        {menus.map((menus) => (
          <div>
            {menus.map((menu) => <MenuItem router={Router} menu={menu} />)}
          </div>
        ))}
      </div>
      {route != "@None" && (
        <ViewContainer width={width}>
          <View />
        </ViewContainer>
      )}
      <div style-resize-handle onMouseDown={onMouseDown} />
    </div>
  );
});

type MenuItemProps = {
  menu: Menu;
  router: Router<string>;
};

const MenuItem = memo(({ menu, router }: MenuItemProps) => {
  Lumber.log(Lumber.RENDER, "MENU ITEM RENDER: " + menu.name);

  const { route, setRoute } = useRouter(router);

  return (
    <div
      style-sidebar-menuitem=""
      style-active={route == menu.name ? "" : undefined}
      style-inactive={route != menu.name ? "" : undefined}
      class={style.menuitem}
      onClick={() => setRoute(menu.name == route ? "@None" : menu.name)}
    >
      {h(menu.icon, {})}
    </div>
  );
});

type ViewContainerProps = {
  width: number;
};

const ViewContainer = memo(
  ({ children, width }: PropsWithChildren<ViewContainerProps>) => {
    Lumber.log(Lumber.RENDER, "VIEW CONTAINER RERENDER");

    return (
      <div style-sidebar-view="" data-width={width}>
        {children}
      </div>
    );
  },
);
