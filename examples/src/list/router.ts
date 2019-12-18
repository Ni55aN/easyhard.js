import { h, $, Fragment, appendChild, compose, untilExist, $provide, $inject } from 'easyhard';
import { Observable, Observer } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

type Route = {
  path: string;
  component: () => HTMLElement;
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

class RouteObservable extends Observable<string> {
  constructor() {
    super((observer: Observer<string>) => {
      const handle = () => observer.next(parse(location.hash));
      window.addEventListener('hashchange', handle, false);
      handle();
      return () => window.removeEventListener('hashchange', handle);
    })
  }
}

function useRouter() {
  const currentRoute = new $<Route | null>(null);
  const parentRoute = new $<null | ParentRoute>(null);

  return {
    navigate(path: string) {
      location.hash = stringify(getFullPath(parentRoute.value) + path);
    },
    routerOutlet(routes: Route[]) {
      return compose(
        $inject(useRouter, parentRoute),
        $provide(useRouter, new $<ParentRoute>({ current: currentRoute, parent: parentRoute })),
        $router(routes, parentRoute, r => currentRoute.next(r))
      );
    }
  }
}

function $router(routes: Route[], parentRoute: $<ParentRoute | null>, mounted: (route: Route) => void ) {
  const fragment = new Fragment('$router');
  const route$ = new RouteObservable();

  return (parent: ChildNode) => {
    parent.appendChild(fragment.getRoot());

    route$.pipe(
      untilExist(fragment.getRoot()),
      map(path => {
        const prefix = getFullPath(parentRoute.value);

        return routes.find(r => Boolean(r.path === '*' || path.match(prefix + r.path)));
      }),
      distinctUntilChanged()
    ).subscribe(route => {
      fragment.clear();
      if (route) {
        const el = appendChild(route.component(), parent, fragment);
        mounted(route);
        fragment.insertChild(el, 0);
      }
    });
    
    return fragment;
  }
}


const child2Routes: Route[] = [
  {
    path: 'f',
    component: () => h('f' as any, {}, 'C/D/F')
  },
  {
    path: 'g',
    component: () => h('g' as any, {}, 'C/D/G')
  },
  {
    path: '*',
    component: () => {
      return h('span', {}, '-');
    }
  }
]


const childRoutes: Route[] = [
  {
    path: 'd',
    component: () => {
      const { routerOutlet, navigate } = useRouter();

      return h('c' as any, {},
        routerOutlet(child2Routes),
        h('button', { click() { navigate('f') }}, 'C/D/F'),
        h('button', { click() { navigate('g') }}, 'C/D/G'),
      );
    }
  },
  {
    path: 'e',
    component: () => h('e' as any, {}, 'C/E')
  },
  {
    path: '*',
    component: () => h('f' as any, {}, 'C/F')
  }
]

const routes: Route[] = [
  {
    path: 'a',
    component: () => h('a', {}, 'A')
  },
  {
    path: 'b',
    component: () => h('b', {}, 'B')
  },
  {
    path: 'c',
    component: () => {
      const { routerOutlet, navigate } = useRouter();

      return h('c' as any, {},
        routerOutlet(childRoutes),
        h('button', { click() { navigate('d') }}, 'C/D'),
        h('button', { click() { navigate('e') }}, 'C/E'),
      );
    }
  }
]

function App() {
  const { routerOutlet, navigate } = useRouter();

  return h('div', {},
    routerOutlet(routes),
    h('button', { click() { navigate('a')}}, 'A'),
    h('button', { click() { navigate('b')}}, 'B'),
    h('button', { click() { navigate('c')}}, 'C')
  )
}

document.body.appendChild(App());