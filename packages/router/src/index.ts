/* eslint-disable @typescript-eslint/prefer-regexp-exec */
import { h, $, $provide, $inject } from 'easyhard';
import { combineLatest, of } from 'rxjs';
import { distinctUntilChanged, map, tap, switchMap } from 'rxjs/operators';
import { fromLocation, getFullPath, stringify } from './location';
import { ParentRoute, Route } from './types';

export function useRouter(): { navigate(path: string): void, routerOutlet(routes: Route[]): HTMLElement } {
  const currentRoute = $<Route | null>(null);
  const parentRoute = $<null | ParentRoute>(null);

  return {
    navigate(path) {
      location.hash = stringify(getFullPath(parentRoute.value) + path);
    },
    routerOutlet(routes) {
      const route$ = fromLocation();

      return h('span', {},
        $inject(useRouter, parentRoute),
        $provide(useRouter, $<ParentRoute>({ current: currentRoute, parent: parentRoute })),
        combineLatest([route$, parentRoute]).pipe(
          map(([path, parent]) => {
            const prefix = getFullPath(parent);

            return routes.find(r => Boolean(r.path === '*' || path.match(prefix + r.path)));
          }),
          distinctUntilChanged(),
          tap(route => route && currentRoute.next(route)),
          switchMap(route => route ? of(null).pipe(route.component) : of(null))
        )
      );
    }
  }
}