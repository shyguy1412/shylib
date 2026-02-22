import { createStore } from '@xstate/store';
import { useSelector } from '@xstate/store-react';
import { ComponentChild, Fragment, h } from 'preact';
import { useCallback } from 'preact/hooks';
import { memo } from 'preact/compat';
import { Lumber } from '@/lib/log/Lumber';

export type View<T = {}> = (props: T) => h.JSX.Element;

export type Router<R extends string = string, V extends View<any> = View<any>> =
    ReturnType<
        typeof createRouter<RouteTable<R, V>>
    >;

export type RouteTable<
    R extends string = string,
    V extends View<any> = View<any>,
> = {
    [route in R]: V;
};

export type Route<R extends Router> = R extends Router<infer Routes, any> ? Routes :
    never;

const None: View = () => h(Fragment, {} as any);

//? subrouting: allow for a route to have its own router that can be reflected in the breadcrumbs
//? route state

export function createRouter<R extends RouteTable<string, View<any>>>(
    routeTable: R,
    initial: keyof R | (keyof R)[],
    fallback?: R[keyof R],
) {
    const initialRoute = typeof initial == 'string' ?
        [initial] :
        (initial as (keyof R)[]);
    const initialView = routeTable[initialRoute.at(-1) ?? ''] as View<unknown>;

    const store = createStore({
        context: {
            route: initialRoute,
            view: (initialView ?? fallback ?? None) as R[keyof R],
        },
        on: {
            setRoute: (_, event: { route: keyof R }) => ({
                route: [event.route],
                view: routeTable[event.route] ?? fallback ?? None,
            }),

            addBreadcrumb: ({ route }, event: { route: keyof R }) => ({
                route: [...route, event.route],
                view: routeTable[event.route] ?? fallback ?? None,
            }),

            followBreadcrumb: ({ route }, event: { route: keyof R }) => ({
                route: route.slice(0, route.indexOf(event.route) + 1),
                view: routeTable[event.route] ?? fallback ?? None,
            }),

            popBreadcrumb: ({ route }) => ({
                route: route.slice(0, -1),
                view: routeTable[route.at(-2)!] ?? fallback ?? None,
            }),
        },
    });

    return store;
}

export function useRouter<R extends string, V extends View<any>>(
    router: Router<R, V>,
) {
    return {
        setRoute: useCallback(
            (route: R) => router.trigger.setRoute({ route }),
            [router],
        ),
        addBreadcrumb: useCallback(
            (route: R) => router.trigger.addBreadcrumb({ route }),
            [router],
        ),
        followBreadcrumb: useCallback(
            (route: R) => router.trigger.followBreadcrumb({ route }),
            [router],
        ),
        popBreadcrumb: useCallback(
            () => router.trigger.popBreadcrumb(),
            [router],
        ),
    };
}

export function useView<R extends string, V extends View<any>>(
    router: Router<R, V>,
) {
    return useSelector(router, (state) => state.context.view);
}
export function useRoute<R extends string, V extends View<any>>(
    router: Router<R, V>,
) {
    return useSelector(router, (state) => state.context.route);
}

namespace Breadcrumbs {
    export type Props<T extends string, V extends View<any>> = {
        router: Router<T, V>;
        separator?: ComponentChild;
    };
}

export const Breadcrumbs = memo(
    <T extends string, V extends View<any>>(
        { router, separator }: Breadcrumbs.Props<T, V>,
    ) => {
        const { followBreadcrumb } = useRouter(router);
        const route = useRoute(router);

        Lumber.log(Lumber.RENDER, 'BREADCRUMBS RENDER');

        return route
            .map((crumb) => (
                <span
                    style-breadcrumb=''
                    onClick={useCallback(() => followBreadcrumb(crumb), [
                        router,
                    ])}
                >
                    {crumb}
                </span>
            ))
            .reduce((prev, cur) => (
                <>
                    {prev}
                    &nbsp;
                    <span style-breadcrumb-separator=''>
                        {separator ?? '>'}
                    </span>
                    &nbsp;
                    {cur}
                </>
            ));
    },
);
