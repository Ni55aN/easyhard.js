import { h, $, $provide, $inject } from 'easyhard';
import { combineLatest, of } from 'rxjs';
import { distinctUntilChanged, map, tap, switchMap } from 'rxjs/operators';
import { fromLocation, toPath, match, setLocation } from './location';
import { ParentRoute, Path, Route } from './types';

type UseRouter = { navigate(path: Path): void, routerOutlet(routes: Route[]): HTMLElement }

export function useRouter(): UseRouter {
  const currentRoute = $<Route | null>(null);
  const parentRoute = $<null | ParentRoute>(null);

  return {
    navigate(path) {
      setLocation([...toPath(parentRoute.value), ...path]);
    },
    routerOutlet(routes) {
      const path$ = fromLocation();

      return h('span', {},
        $inject(useRouter, parentRoute),
        $provide(useRouter, $<ParentRoute>({ current: currentRoute, parent: parentRoute })),
        combineLatest([path$, parentRoute]).pipe(
          map(([path, parent]) => {
            const prefix = toPath(parent);

            return routes.find(r => r.path === '*' || match(path, [...prefix, r.path]))
          }),
          distinctUntilChanged(),
          tap(route => route && currentRoute.next(route)),
          switchMap(route => route ? of(null).pipe(route.component) : of(null))
        )
      );
    }
  }
}

export * from './types'
