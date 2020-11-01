import { h, $, $provide, $inject } from 'easyhard';
import { combineLatest, Observable, of } from 'rxjs';
import { distinctUntilChanged, map, tap, switchMap } from 'rxjs/operators';
import { History } from 'history';
import { fromHistory, toPath, match } from './location';
import { ParentRoute, Path, Route } from './types';

type UseRouter = {
  navigate(path: Path, params?: ConstructorParameters<typeof URLSearchParams>[0], replace?: boolean): void;
  routerOutlet(routes: Route[]): HTMLElement;
  params: Observable<URLSearchParams>;
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
    navigate(path, params, replace = false) {
      const fullPath = [...toPath(parentRoute.value), ...path]
      const to = `/${fullPath.join('/')}?${params ? new URLSearchParams(params).toString() : ''}`
  
      if (replace) {
        history.replace(to)
      } else {
        history.push(to)
      }
    },
    get params() {
      const location$ = fromHistory(history);
      
      return location$.pipe(map(l => new URLSearchParams(l.search)))
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
