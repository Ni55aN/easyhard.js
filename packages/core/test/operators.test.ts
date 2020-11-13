import { map } from 'rxjs/operators'
import { $, $$, $for, $if, $inject, $provide, $show, h, untilExist } from '../src/index'
import { delay, waitAnimationFrame } from './utils/timers'

describe('operators', () => {
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

  it('$show', async () => {
    const is = $(true)
    const div = h('div', {},
      $show(is, () => h('div', { id: 'child' }, 'test'))
    )
    document.body.appendChild(div)
    await waitAnimationFrame()

    const el = document.body.querySelector('#child') as Element
    expect(getComputedStyle(el).display).not.toBe('none')
    is.next(false)
    await waitAnimationFrame()
    expect(getComputedStyle(el).display).toBe('none')
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

  describe('untilExist', () => {
    let fn: jest.Mock
    let value$: $<number>
    let div: HTMLElement
  
    beforeEach(() => {
      div = document.createElement('div')
      value$ = $(0)
      fn = jest.fn()
      value$.pipe(untilExist(div)).subscribe(fn)
    })
    afterEach(() => {
      document.body.innerHTML = ''
    })

    it('emits after adding to body', async () => {
      expect(fn).not.toBeCalled()
      document.body.appendChild(div)
      await waitAnimationFrame()
      expect(fn).toBeCalledTimes(1)
    })

    it('dont miss any emited value', async () => {
      expect(fn).toBeCalledTimes(0)
      value$.next(1)
      expect(fn).toBeCalledTimes(0)
      value$.next(2)
      expect(fn).toBeCalledTimes(0)
      document.body.appendChild(div)
      await waitAnimationFrame()
      expect(fn).toBeCalledTimes(3)
    })

    it('unsubscribe on remove', async () => {
      expect(fn).not.toBeCalled()
      document.body.appendChild(div)
      await waitAnimationFrame()
      expect(fn).toBeCalledTimes(1)
      document.body.removeChild(div)
      await waitAnimationFrame()
      value$.next(1)
      expect(fn).toBeCalledTimes(1)
    })
  })
})