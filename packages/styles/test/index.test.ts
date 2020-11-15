import { h, $ } from 'easyhard'
import '@testing-library/jest-dom'
import { css, injectStyles } from '../src'
import { waitAnimationFrame } from './utils/timers'

describe('styles', () => {
  afterEach(() => {
    document.head.innerHTML = ''
  })

  it('body - className', () => {
    const { className } = css({ background: 'red' })
    document.body.className = className

    expect(document.body).toHaveStyle({ background: 'red' })
  })

  it('h - className', () => {
    const { className } = css({ background: 'red' })
    const div = h('div', { className })

    expect(div).toHaveStyle({ background: 'red' })
  })

  it('observable', () => {
    const color$ = $('red')
    const { className } = css({ background: color$ })
    const div = h('div', { className })

    expect(div).toHaveStyle({ background: 'red' })
    color$.next('green')
    expect(div).toHaveStyle({ background: 'green' })
  })

  describe('injectStyles', () => {
    afterEach(() => {
      document.head.innerHTML = ''
    })

    it('accepts styles asynchronously', async () => {
      const div = h('div', {}, injectStyles({ background: 'red' }))
      document.body.appendChild(div)
  
      expect(div).not.toHaveStyle({ background: 'red' })
      await waitAnimationFrame()
      expect(div).toHaveStyle({ background: 'red' })
    })

    it('accept css()', async () => {
      const style1 = css({ background: 'red' })
      const div = h('div', {}, injectStyles(style1))
      document.body.appendChild(div)
      await waitAnimationFrame()

      expect(div).toHaveStyle({ background: 'red' })
    })

    it('accept Style declaration', async () => {
      const div = h('div', {}, injectStyles({ background: 'red' }))
      document.body.appendChild(div)
      await waitAnimationFrame()

      expect(div).toHaveStyle({ background: 'red' })
    })

    it('remove style if element removed', async () => {
      const div = h('div', {}, injectStyles({ background: 'red' }))
      document.body.appendChild(div)
  
      await waitAnimationFrame()
      expect(document.head).not.toBeEmptyDOMElement()
      expect(div).toHaveStyle({ background: 'red' })
      document.body.removeChild(div)
      await waitAnimationFrame()
      expect(document.head).toBeEmptyDOMElement()
      expect(div).not.toHaveStyle({ background: 'red' })
    })
  })
})
