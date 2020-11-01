/* eslint-disable @typescript-eslint/prefer-regexp-exec */
import { h, $, $provide, $inject } from 'easyhard';
import { Observable, Observer, combineLatest, OperatorFunction, of } from 'rxjs';
import { distinctUntilChanged, map, tap, switchMap } from 'rxjs/operators';

export type Route = {
  path: string;
  component: OperatorFunction<null, HTMLElement>
}
export type ParentRoute = {
  current: $<Route | null>;
  parent: $<ParentRoute | null>;
}

const parse = (path: string) => path.slice(1);
const stringify = (path: string) => `#${path}`;
const getFullPath = (route: ParentRoute | null): string => {
  if (!route) return '';
  const { parent, current } = route;

  return (parent ? getFullPath(parent.value) : '') + (current && current.value ? `${current.value.path as string}/` : '');
}

function fromRoute() {
  return new Observable<string>((observer: Observer<string>) => {
    const handle = () => observer.next(parse(location.hash));
    window.addEventListener('hashchange', handle, false);
    handle();
    return () => window.removeEventListener('hashchange', handle);
  })
}

export function useRouter(): { navigate(path: string): void, routerOutlet(routes: Route[]): HTMLElement } {
  const currentRoute = $<Route | null>(null);
  const parentRoute = $<null | ParentRoute>(null);
  
  return {
    navigate(path) {
      location.hash = stringify(getFullPath(parentRoute.value) + path);
    },
    routerOutlet(routes) {
      const route$ = fromRoute();

      return h('span', {},
        $inject(useRouter, parentRoute),
        $provide(useRouter, $<ParentRoute>({ current: currentRoute, parent: parentRoute })),
        combineLatest(route$, parentRoute).pipe(
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