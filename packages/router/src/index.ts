import { h, $, $provide, $inject } from 'easyhard';
import { combineLatest, of } from 'rxjs';
import { distinctUntilChanged, map, tap, switchMap } from 'rxjs/operators';
import { History } from 'history';
import { fromHistory, toPath, match } from './location';
import { ParentRoute, Path, Route } from './types';

type UseRouter = {
  navigate(path: Path, replace?: boolean): void;
  routerOutlet(routes: Route[]): HTMLElement;
  back(): void;
  forward(): void;
}
type UseRouterProps = {
  history: History
}

export function useRouter({ history }: UseRouterProps): UseRouter {
  const currentRoute = $<Route | null>(null);
  const parentRoute = $<null | ParentRoute>(null);

  return {
    navigate(path, replace = false) {
      const pathString = [...toPath(parentRoute.value), ...path].join('/')
  
      if (replace) {
        history.replace(`/${pathString}`)
      } else {
        history.push(`/${pathString}`)
      }
    },
    back() {
      history.back()
    },
    forward() {
      history.forward()
    },
    routerOutlet(routes) {
      const location$ = fromHistory(history);

      return h('span', {},
        $inject(useRouter, parentRoute),
        $provide(useRouter, $<ParentRoute>({ current: currentRoute, parent: parentRoute })),
        combineLatest([location$, parentRoute]).pipe(
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
