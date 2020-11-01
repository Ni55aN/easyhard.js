import { h } from 'easyhard';
import { map, tap } from 'rxjs/operators';
import { createHashHistory } from 'history';
import { Route, useRouter as useRouterOrigin } from 'easyhard-router'

const history = createHashHistory()
const useRouter = () => useRouterOrigin({ history })

const child2Routes: Route[] = [
  {
    path: 'f',
    component: map(() => h('span', { id: 'f' }, 'C/D/F'))
  },
  {
    path: 'g',
    component: map(() => h('span', { id: 'g' }, 'C/D/G'))
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

      return h('span', { id: 'c' },
        routerOutlet(child2Routes),
        h('button', { click: tap(() => navigate(['f'])) }, 'C/D/F'),
        h('button', { click: tap(() => navigate(['g'])) }, 'C/D/G'),
      );
    })
  },
  {
    path: 'e',
    component: map(() => h('span', { id: 'e' }, 'C/E'))
  },
  {
    path: '*',
    component: map(() => h('span', { id: 'f' }, 'C/F'))
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

      return h('span', { id: 'c' },
        routerOutlet(childRoutes),
        h('button', { click: tap(() => navigate(['d'])) }, 'C/D'),
        h('button', { click: tap(() => navigate(['e'])) }, 'C/E'),
      );
    })
  }
]

function App() {
  const { routerOutlet, navigate, params } = useRouter();

  return h('span', {},
    'query=', params.pipe(map(p => p.get('query'))),
    h('br', {}),
    routerOutlet(routes),
    h('button', { click: tap(() => navigate(['a'], { key: '12345' })) }, 'A'),
    h('button', { click: tap(() => navigate(['b'])) }, 'B'),
    h('button', { click: tap(() => navigate(['c'])) }, 'C')
  )
}

document.body.appendChild(App());