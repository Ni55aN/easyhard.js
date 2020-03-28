import { h, $, $provide, $inject } from 'easyhard';
import { Observable, Observer, combineLatest, OperatorFunction, of } from 'rxjs';
import { distinctUntilChanged, map, tap, filter, switchMap } from 'rxjs/operators';

type Route = {
  path: string;
  component: OperatorFunction<null, HTMLElement>
}
type ParentRoute = {
  current: $<Route | null>;
  parent: $<ParentRoute | null>;
}

const parse = (path: string) => path.slice(1);
const stringify = (path: string) => `#${path}`;
const getFullPath = (route: ParentRoute | null): string => {
  if (!route) return '';
  const { parent, current } = route;

  return (parent ? getFullPath(parent.value) : '') + (current && current.value ? current.value.path + '/' : '');
}

function fromRoute() {
  return new Observable<string>((observer: Observer<string>) => {
    const handle = () => observer.next(parse(location.hash));
    window.addEventListener('hashchange', handle, false);
    handle();
    return () => window.removeEventListener('hashchange', handle);
  })
}

function useRouter() {
  const currentRoute = $<Route | null>(null);
  const parentRoute = $<null | ParentRoute>(null);
  
  return {
    navigate(path: string) {
      location.hash = stringify(getFullPath(parentRoute.value) + path);
    },
    routerOutlet(routes: Route[]) {
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

const child2Routes: Route[] = [
  {
    path: 'f',
    component: map(() => h('f' as any, {}, 'C/D/F'))
  },
  {
    path: 'g',
    component: map(() => h('g' as any, {}, 'C/D/G'))
  },
  {
    path: '*',
    component: map(() => {
      return h('span', {}, '-');
    })
  }
]


const childRoutes: Route[] = [
  {
    path: 'd',
    component: map(() => {
      const { routerOutlet, navigate } = useRouter();

      return h('c' as any, {},
        routerOutlet(child2Routes),
        h('button', { click() { navigate('f') }}, 'C/D/F'),
        h('button', { click() { navigate('g') }}, 'C/D/G'),
      );
    })
  },
  {
    path: 'e',
    component: map(() => h('e' as any, {}, 'C/E'))
  },
  {
    path: '*',
    component: map(() => h('f' as any, {}, 'C/F'))
  }
]

const routes: Route[] = [
  {
    path: 'a',
    component: map(() => h('a', {}, 'A'))
  },
  {
    path: 'b',
    component: map(() => h('b', {}, 'B'))
  },
  {
    path: 'c',
    component: map(() => {
      const { routerOutlet, navigate } = useRouter();

      return h('c' as any, {},
        routerOutlet(childRoutes),
        h('button', { click() { navigate('d') }}, 'C/D'),
        h('button', { click() { navigate('e') }}, 'C/E'),
      );
    })
  }
]

function App() {
  const { routerOutlet, navigate } = useRouter();

  return h('span', {},
    routerOutlet(routes),
    h('button', { click() { navigate('a')}}, 'A'),
    h('button', { click() { navigate('b')}}, 'B'),
    h('button', { click() { navigate('c')}}, 'C')
  )
}

document.body.appendChild(App());