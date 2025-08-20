import style from "./Menu.module.css";
import { ComponentChildren, h } from "preact";
import { memo, useMemo } from "preact/compat";
import { Lumber } from "@/lib/log/Lumber";
import { Router, useRouter } from "@/lib/Router";
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";

namespace Menu {
  export type Props<R extends string> = {
    router: Router<R>;
    entries?: [R, string][];
    children?: ComponentChildren;
    title: string;
  };
}

export const Menu = memo(function <R extends string>({
  router,
  entries,
  children,
  title
}: Menu.Props<R>) {
  Lumber.log(Lumber.RENDER, "MENU RENDER");

  const { addBreadcrumb, breadcrumbs, popBreadcrumb } = useRouter(router);

  const entrieElements = useMemo(() => entries?.map(([route, label]) =>
    <button style-entry="" onClick={() => addBreadcrumb(route)}>{label}</button>
  ), [entries]);


  return <div class={style.menu}>
    <h1>
      {breadcrumbs.length > 1 && <button class={style.back} onClick={popBreadcrumb}>
        <MdKeyboardDoubleArrowLeft
        ></MdKeyboardDoubleArrowLeft>
      </button>}
      {title}
    </h1>
    {entrieElements}
    {children}
  </div>;
});

