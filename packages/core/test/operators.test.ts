import { map } from 'rxjs/operators'
import { $, $$, $for, $if, $inject, $provide, $show, Child, h, untilExist } from '../src/index'
import { delay, waitAnimationFrame } from './utils/timers'

describe('operators', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('$if - true/false', async () => {
    const is = $(false)
    const div = h('div', {},
      $if(is, () => 'test')
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
      $if(is, () => h('div', {},
        $if(is, () => 'test')
      ))
    )
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(document.body.textContent).toBe('')
    is.next(true)
    await waitAnimationFrame()
    expect(document.body.textContent).toBe('test')
  })

  it('$if - else', async () => {
    const is = $(false)
    const div = h('div', {},
      $if(is, () => h('div', {}, '111'), () => h('div', {}, '222'))
    )
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(document.body.textContent).toBe('222')
    is.next(true)
    await waitAnimationFrame()
    expect(document.body.textContent).toBe('111')
  })

  it('$show', async () => {
    const is = $(true)
    const div = h('div', {},
      $show(is, () => h('div', { id: 'child' }, 'test')),
      $show(is, () => $('child2').pipe(map(id => h('div', { id }, 'test'))))
    )
    document.body.appendChild(div)
    await waitAnimationFrame()

    const el1 = document.body.querySelector('#child') as Element
    const el2 = document.body.querySelector('#child') as Element
    expect(getComputedStyle(el1).display).not.toBe('none')
    expect(getComputedStyle(el2).display).not.toBe('none')
    is.next(false)
    await waitAnimationFrame()
    expect(getComputedStyle(el1).display).toBe('none')
    expect(getComputedStyle(el2).display).toBe('none')
  })

  it('$for', async () => {
    const collection = $$([1,2,3])
    const div = h('div', {}, $for<number>(collection, item => item))
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(document.body.textContent).toBe('123')
  })

  it('$for - insert', async () => {
    const collection = $$([1,2,3])
    const div = h('div', {}, $for<number>(collection, item => item))
    document.body.appendChild(div)

    collection.insert(4)
    await delay(100)
    expect(document.body.textContent).toBe('1234')
  })

  it('$for - insert before render', async () => {
    const collection = $$([1,2,3])
    const div = h('div', {}, $for<number>(collection, item => item))

    collection.insert(4)
    await delay(100)
    document.body.appendChild(div)
    await waitAnimationFrame()
    expect(document.body.textContent).toBe('1234')
  })

  it('$for - async insert', async () => {
    const collection = $$([1,2,3])
    const div = h('div', {}, $for<number>(collection, item => item, { comparator: (a, b) => a < b}))
    document.body.appendChild(div)

    await waitAnimationFrame()
    collection.insert(0)
    await delay(100)
    expect(document.body.textContent).toBe('0123')
  })

  it('$for - remove', async () => {
    const collection = $$([1,2,3])
    const div = h('div', {}, $for<number>(collection, item => item))
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(document.body.textContent).toBe('123')
    collection.remove(2)
    await waitAnimationFrame()
    expect(document.body.textContent).toBe('13')
  })

  it('$for - removeAt', async () => {
    const collection = $$([1,2,3])
    const div = h('div', {}, $for<number>(collection, item => item))
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(document.body.textContent).toBe('123')
    collection.remove(2)
    await waitAnimationFrame()
    expect(document.body.textContent).toBe('13')
  })

  describe('$inject/$provide', () => {
    const StateKey = {}

    function ChildComponent<T extends Child>(initial: T | null = null) {
      const state = $(initial)
      return h('div', {}, $inject(StateKey, state), state)
    }
    function Parent<T>(props: { showChild: $<boolean>, state: $<T>, content: HTMLElement }) {
      return h('div', {},
        $provide(StateKey, props.state),
        $if(props.showChild, () => props.content)
      )
    }

    it('basic', async () => {
      const showChild = $(false)
      const state = $('test')
      const div = Parent({ showChild, state, content: ChildComponent() })
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

    it('nullable value', async () => {
      const showChild = $(false)
      const state = $(0)
      const div = Parent({ showChild, state, content: ChildComponent('test') })
      document.body.appendChild(div)

      showChild.next(true)
      await waitAnimationFrame()
      expect(document.body.textContent).toBe('0')
    })
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
