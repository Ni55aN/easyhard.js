import { interval, Subject } from 'rxjs'
import { map, mergeMap, take, takeUntil, tap } from 'rxjs/operators'
import { delay, waitAnimationFrame } from './utils/timers'

describe('core', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('div', () => {
    const div = h('div', {})

    expect(div).toBeInstanceOf(HTMLDivElement)
  })

  it('static children', () => {
    const div = h('div', {}, '111', h('b', {}, '222', '111'))

    expect(div.textContent).toBe('111222111')
    expect(div.querySelector('b')?.textContent).toBe('222111')
  })

  it('observable children', async () => {
    const value = $(111)
    const div = h('div', {}, value, value.pipe(map(v => h('b', {}, 222, v))))
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(div.textContent).toBe('111222111')
    expect(div.querySelector('b')?.textContent).toBe('222111')
  })

  it('attributes', () => {
    const div = h('button', { title: 'test', disabled: true })

    expect(div.getAttribute('title')).toBe('test')
    expect(div.getAttribute('disabled')).toBe('')
  })

  it('observable attributes', async () => {
    const div = h('div', { title: $('test') })
    document.body.appendChild(div)

    expect(div.getAttribute('title')).toBe(null)
    await waitAnimationFrame()
    expect(div.getAttribute('title')).toBe('test')
  })

  it('event handler', async () => {
    const fn = jest.fn()
    const div = h('div', { click: tap(fn) })
    document.body.appendChild(div)

    expect(fn).not.toBeCalled()
  
    div.click()
    await waitAnimationFrame()
    expect(fn).toBeCalled()
  })

  it('event handler Subject', async () => {
    const subject = new Subject<MouseEvent>()
    const div = h('div', { click: subject })
    document.body.appendChild(div)

    const fn = jest.fn()
    subject.subscribe(fn)

    expect(fn).not.toBeCalled()
  
    div.click()
    await waitAnimationFrame()
    expect(fn).toBeCalled()
  })

  it('interval + take', async () => {
    const value = $(null).pipe(mergeMap(() => interval(100).pipe(take(3))))
    const div = h('div', {}, value)
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(div.textContent).toBe('')
    await delay(100)
    expect(div.textContent).toBe('0')
    await delay(100)
    expect(div.textContent).toBe('1')
    await delay(100)
    expect(div.textContent).toBe('2')
    await delay(100)
    expect(div.textContent).toBe('2')
  })

  it('should unsubscribe if element removed', async () => {
    const fn = jest.fn()
    const value = $('111')
    const div = h('div', {}, value.pipe(tap(fn)))
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(fn).toBeCalledTimes(1)
    value.next('222')
    await waitAnimationFrame()
    expect(fn).toBeCalledTimes(2)
    document.body.removeChild(div)
    await waitAnimationFrame()
    value.next('333')
    expect(fn).toBeCalledTimes(2)
  })
  
  it('remove if Observable completed', async () => {
    const complete$ = new Subject()
    const div = h('div', {},
      $('111').pipe(takeUntil(complete$), map(v => h('b', {}, v))),
      $('222').pipe(takeUntil(complete$))
    )
    document.body.appendChild(div)

    await waitAnimationFrame()
    expect(document.body.textContent).toBe('111222')
    complete$.next()
    await waitAnimationFrame()
    expect(document.body.textContent).toBe('')
  })
})