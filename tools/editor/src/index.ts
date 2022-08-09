import { $, $$, $for, h } from 'easyhard'
import { map, tap } from 'rxjs/operators'
import { injectStyles } from 'easyhard-styles'
import { parse } from 'recast/parsers/typescript'
import { Node as ASTNode } from '@babel/types'
import { arrangeRoot, createEditor } from './view'
import { Editor } from './types'
import { process } from './transpiler'

// const tsAst = parse(`
// const k = 45, l = 3
// `)

const tsAst = parse(`
import { console, Boolean } from 'builtins'
import { of } from 'rxjs'
import { filter, mapTo } from 'rxjs/operators'

const f = v => Boolean(v + v)

of(5).pipe(mapTo(45), filter(f)).subscribe(console.log)
`)

// const tsAst = parse(`
// const j = 4
// const q = 7

// function a(arg) {
//   const l = 5

//   return l + j * q + arg
// }

// const ss = 23

// a(ss)
// `)

// const tsAst = parse(`
// function a(num) {}
// function b(num) {}
// function c(num) {}

// a(b(c('abc')))
// `)

// const tsAst = parse(`
// function a(num: number, s: string) {
//   return num + s
// }

// a(1, 'abc', true)
// `)

// const tsAst = parse(`
// const a = 1, b = 2, c = 3

// return a == 1 ? b : c
// `)

// const tsAst = parse(`
// import { $ } from 'easyhard'

// const a = $(1)//, b = v(2)

// a.fgh;
// a.next(2)
// a.next(3)
// `)

// const tsAst = parse(`
// import { $, h } from 'easyhard'

// function add(a, b) {
//   return 0// combineLatest(a, b).pipe(map(([a,b]) => a + b))
// }
// // function Input() {

// // }


// const a = $(1)
// const b = $(0)
// const sum = add(a, b)

// return h('div', {},
//   // Input({ model: a }),
//   // ' + ',
//   // Input({ model: b }),
//   // ' = ',
//   sum
// )
// `)


console.log('Root', tsAst.program.body)


void async function () {
  const tabs = $$<{ name: string, editor: Editor }>([])
  const containers = $$<{ name: string, el: HTMLElement }>([])
  const current = $<string | null>(null)
  const main = h('div', { style: 'width: 100vw; height: 100vh;' },
    h('div', {}, injectStyles({ position: 'absolute', top: 0, left: 0 }),
      $for(tabs, v => h('button', { click: tap(() => openScope(v.name))}, v.name)),
    ),
    $for(containers, v => v.el)
  )
  document.body.appendChild(main)

  async function insertTab(ast: ASTNode) {
    const name = Math.random().toFixed(3)
    const container = h('div', { style: current.pipe(map(c => c === name ? 'width: 100%; height: 100%; overflow: hidden' : 'visibility: hidden'))})
    containers.insert({ name, el: container })
    await new Promise((res) => setTimeout(res, 200))
    const editor = await createEditor(container)

    await process(ast, editor, {  })
    arrangeRoot(editor)
    tabs.insert({ name, editor })

    return name
  }
  async function openScope(name: string) {
    current.next(name)
  }
  openScope(await insertTab(tsAst))
}()
