import { $, $if, h } from 'easyhard'
import { combineLatest, pipe } from 'rxjs'
import { filter, map, mapTo, tap } from 'rxjs/operators'
import { Input } from './input'
import { Todo, useTodos } from './store'

export function TodoItem({ todo }: { todo: Todo }): HTMLElement {
  const { injectStore, deleteTodo, toggleDone, setLabel } = useTodos()
  const editing = $(false)

  function onSave(e: Event) {
    const value = (e.target as HTMLInputElement)?.value.trim()

    if (value) { setLabel(todo.id, value) }
    editing.next(false)
  }

  return (
    h('li', {
      className: combineLatest([editing, todo.done]).pipe(map(([editing, done]) => `${editing ? 'editing' : ''} ${done ? 'completed' : ''}`))
    },
      injectStore,
      h('div', { className: 'view' },
        h('input', {
          type: 'checkbox',
          className: 'toggle',
          checked: todo.done,
          change: pipe(mapTo(todo.id), toggleDone)
        }),
        h('label', { dblclick: tap(() => editing.next(true))}, todo.label),
        h('button', { className: 'destroy', click: pipe(mapTo(todo.id), deleteTodo) })
      ),
      $if(editing, map(() =>
        Input({
          className: 'edit',
          value: todo.label,
          autofocus: true,
          blur: pipe(tap(onSave)),
          keypress: pipe(filter(e => e.key === 'Enter'), tap(onSave))
        })
      ))
    )
  )
}
