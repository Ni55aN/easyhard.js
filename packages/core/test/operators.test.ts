import { map } from 'rxjs/operators'
import { $, $$, $for, $if, $inject, $provide, h } from '../src/index'
import { delay, waitAnimationFrame } from './utils/timers'

describe('hooks', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('$if - true/false', async () => {
    const is = $(false)
    const div = h('div', {},
      $if(is, map(() => 'test'))
    )
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(document.body.textContent).toBe('')
    is.next(true)
    await waitAnimationFrame()
    expect(document.body.textContent).toBe('test')
    is.next(false)
    await waitAnimationFrame()
    expect(document.body.textContent).toBe('')
  })

  it('$if - nested', async () => {
    const is = $(false)
    const div = h('div', {},
      $if(is, map(() => h('div', {},
        $if(is, map(() => 'test'))
      )))
    )
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(document.body.textContent).toBe('')
    is.next(true)
    await waitAnimationFrame()
    expect(document.body.textContent).toBe('test')
  })

  it('$for', async () => {
    const array = $$([1,2,3])
    const div = h('div', {}, $for(array, map(item => item)))
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(document.body.textContent).toBe('123')
  })

  it('$for - insert', async () => {
    const array = $$([1,2,3])
    const div = h('div', {}, $for(array, map(item => item)))
    document.body.appendChild(div)

    array.insert(4)
    await delay(100)
    expect(document.body.textContent).toBe('1234')
  })

  it('$for - insert before render', async () => {
    const array = $$([1,2,3])
    const div = h('div', {}, $for(array, map(item => item)))

    array.insert(4)
    await delay(100)
    document.body.appendChild(div)
    await waitAnimationFrame()
    expect(document.body.textContent).toBe('1234')
  })

  it('$for - async insert', async () => {
    const array = $$([1,2,3])
    const div = h('div', {}, $for(array, map(item => item)))
    document.body.appendChild(div)

    await waitAnimationFrame()
    array.insert(0, 1)
    await delay(100)
    expect(document.body.textContent).toBe('1023')
  })

  it('$inject/$provide', async () => {
    const StateKey = {}

    function Child() {
      const state = $(null)
      return h('div', {}, $inject(StateKey, state), state)
    }
    function Parent<T>(props: { showChild: $<boolean>, state: $<T>, content: HTMLElement }) {
      return h('div', {},
        $provide(StateKey, props.state),
        $if(showChild, map(() => props.content))
      )
    }

    const showChild = $(false)
    const state = $('test')
    const div = Parent({ showChild, state, content: Child() })
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(document.body.textContent).toBe('')
    showChild.next(true)
    await waitAnimationFrame()
    expect(document.body.textContent).toBe('test')
    state.next('state')
    await waitAnimationFrame()
    expect(document.body.textContent).toBe('state')
  })
})