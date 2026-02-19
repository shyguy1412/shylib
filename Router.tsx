import { createStore } from '@xstate/store';
import { useSelector } from '@xstate/store-react';
import { Attributes, ComponentChild, Fragment, h } from 'preact';
import { useCallback } from 'preact/hooks';
import { memo } from 'preact/compat';
import { Lumber } from '@/lib/log/Lumber';

export type View<T = {}> = (props: T) => h.JSX.Element;

export type Router<R extends string = string, V extends View<any> = View<any>> = ReturnType<
    typeof createRouter<RouteTable<R, V>>
>;

export type RouteTable<
    R extends string = string,
    V extends View<any> = View,
> = {
    [route in R]: V;
};

const None: View = () => h(Fragment, {} as any);

//? subrouting: allow for a route to have its own router that can be reflected in the breadcrumbs
//? route state

export function createRouter<R extends RouteTable<string, View<any>>>(
    routeTable: R,
    initial: keyof R,
) {
    const store = createStore({
        context: { route: [initial], view: routeTable[initial] },
        on: {
            setRoute: (_, event: { route: keyof R }) => ({
                route: [event.route],
                view: routeTable[event.route] ?? None,
            }),
            addBreadcrumb: (
                { route },
                event: { route: keyof R },
            ) => ({
                route: [...route, event.route],
                view: routeTable[event.route] ?? None,
            }),
            followBreadcrumb: (
                { route },
                event: { route: keyof R },
            ) => ({
                route: route.slice(0, route.indexOf(event.route) + 1),
                view: routeTable[event.route] ?? None,
            }),
            popBreadcrumb: ({ route }) => ({
                route: route.slice(0, -1),
                view: routeTable[route.at(-2)!] ?? None,
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
            [
                router,
            ],
        ),
        addBreadcrumb: useCallback(
            (route: R) => router.trigger.addBreadcrumb({ route }),
            [
                router,
            ],
        ),
        followBreadcrumb: useCallback(
            (route: R) => router.trigger.followBreadcrumb({ route }),
            [
                router,
            ],
        ),
        popBreadcrumb: useCallback(() => router.trigger.popBreadcrumb(), [
            router,
        ]),
        route: useSelector(router, (state) => state.context.route.at(-1)!),
        breadcrumbs: useSelector(router, (state) => state.context.route),
        View: useSelector(router, (state) => state.context.view),
    };
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
        const { breadcrumbs, followBreadcrumb } = useRouter(router);

        Lumber.log(Lumber.RENDER, 'BREADCRUMBS RENDER');

        return breadcrumbs
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
