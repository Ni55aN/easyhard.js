import { h } from '../src/index'

describe('h', () => {
  it('test', () => {
    const div = h('div', {})

    expect(div).toBeInstanceOf(HTMLDivElement)
  })
})