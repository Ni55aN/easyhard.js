import { Child, h } from 'easyhard'
import { useRouter } from 'easyhard-router'
import { createHashHistory } from 'history'
import { Observable, pipe } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { preventDefault } from '../../operators/prevent-default'

const history = createHashHistory()

export type Filter = null | 'active' | 'completed'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function FilterLink({ type }: { type: string }, ...children: Child[]) {
  const router = useRouter({ history })
  const isActive = router.params.pipe(map(p => p.get('filter') === type))

  return h('a', {
    href: '',
    click: pipe(preventDefault(), tap(() => router.navigate([], { filter: type }))),
    className: isActive.pipe(map(is => is ? 'selected' : ''))
  }, ...children)
}

export function useFilter(): Observable<Filter> {
  const router = useRouter({ history })

  return router.params.pipe(map(p => p.get('filter') as Filter))
}
