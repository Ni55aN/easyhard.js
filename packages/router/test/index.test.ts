import { h } from 'easyhard'
import { map } from 'rxjs/operators'
import '@testing-library/jest-dom'
import { createMemoryHistory, MemoryHistory, History } from 'history'
import { Route, UseRouter, useRouter } from '../src'
import { waitAnimationFrame } from './utils/timers'
import { firstValueFrom } from 'rxjs'

const routes: Route[] = [
  {
    path: 'a',
    component: map(() => h('a', {}, 'A'))
  },
  {
    path: 'b',
    component: map(() => h('b', {}, 'B'))
  }
]

async function initRouter(routes: Route[], history: History) {
  const { routerOutlet, ...props } = useRouter({ history })
  const div = h('div', {}, routerOutlet(routes))
  document.body.appendChild(div)

  await waitAnimationFrame()

  return props
}

describe('router', () => {
  let history: MemoryHistory

  beforeEach(() => {
    history = createMemoryHistory()
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('change history', async () => {
    await initRouter(routes, history)
    expect(document.body).toHaveTextContent('')

    history.push('/a')
    await waitAnimationFrame()
    expect(document.body).toHaveTextContent('A')

    history.push('/b')
    await waitAnimationFrame()
    expect(document.body).toHaveTextContent('B')

    history.back()
    await waitAnimationFrame()
    expect(document.body).toHaveTextContent('A')
  })

  it('navigate/bach/forward', async () => {
    const { navigate, back, forward } = await initRouter(routes, history)
    expect(document.body).toHaveTextContent('')

    navigate(['a'])
    await waitAnimationFrame()
    expect(document.body).toHaveTextContent('A')
    navigate(['b'], {}, true)
    await waitAnimationFrame()
    expect(document.body).toHaveTextContent('B')
    back()
    await waitAnimationFrame()
    expect(document.body).toHaveTextContent('')
    forward()
    await waitAnimationFrame()
    expect(document.body).toHaveTextContent('B')
  })

  it('params', async () => {
    const { params } = await initRouter(routes, history)

    history.push('/a?param1=111')
    await waitAnimationFrame()
    const urlParams = await firstValueFrom(params)
    const param1 = urlParams.get('param1')

    expect(param1).toBe('111')
  })

  it('parent route', async () => {
    let childRouter: null | UseRouter = null
    const cRoute: Route = {
      path: 'c',
      component: map(() => {
        childRouter = useRouter({ history })

        return h('div', {}, childRouter.routerOutlet(routes))
      })
    }
    const { navigate } = await initRouter([...routes, cRoute], history)

    expect(childRouter).toBe(null)
    await waitAnimationFrame()

    navigate(['c'])
    await waitAnimationFrame()
    expect(childRouter).not.toBe(null)

    if (childRouter) {
      (childRouter as UseRouter).navigate(['a'])
      expect(history.location.pathname).toBe('/c/a')
      expect(document.body).toHaveTextContent('A')
    }
  })
})
