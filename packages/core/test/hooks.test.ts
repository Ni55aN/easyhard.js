import { h, onDestroy, onMount } from '../src/index'
import { waitAnimationFrame } from './utils/timers'

describe('hooks', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('onMount - any html element', async () => {
    const fn = jest.fn()
    const div = h('div', {})
    onMount(div, fn)

    expect(fn).not.toBeCalled()
    document.body.appendChild(div)
    expect(fn).not.toBeCalled()
    await waitAnimationFrame()
    expect(fn).toBeCalled()
  })

  // it('onMount - as child', async () => { // FIXME
  //   const fn = jest.fn()
  //   const div = h('div', {}, onMount(fn))

  //   expect(fn).not.toBeCalled()
  //   document.body.appendChild(div)
  //   expect(fn).not.toBeCalled()
  //   await waitAnimationFrame()
  //   expect(fn).toBeCalled()
  // })

  it('onDestroy - any html element', async () => {
    const fn = jest.fn()
    const div = h('div', {})
    onDestroy(div, fn)

    document.body.appendChild(div)
    await waitAnimationFrame()
    expect(fn).not.toBeCalled()
    document.body.removeChild(div)
    await waitAnimationFrame()
    expect(fn).toBeCalled()
  })

  it('onDestroy - as child', async () => {
    const fn = jest.fn()
    const div = h('div', {}, onDestroy(fn))

    document.body.appendChild(div)
    await waitAnimationFrame()
    expect(fn).not.toBeCalled()
    document.body.removeChild(div)
    await waitAnimationFrame()
    expect(fn).toBeCalled()
  })
})