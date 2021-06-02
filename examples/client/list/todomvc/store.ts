import { $provide, $inject } from 'easyhard'
import { $, $$, $$Return } from 'easyhard-common'
import { Observable } from 'rxjs'
import { mergeMap, tap } from 'rxjs/operators'

export type Todo = { id: string, label: Observable<string>, done: Observable<boolean> }
type MutableTodo = { id: string, label: $<string>, done: $<boolean> }

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useTodos() {
  const store = $({
    todos: $$<MutableTodo>([])
  })
  const todos = store.pipe(mergeMap(data => data.todos)) as Observable<$$Return<Todo>>

  return {
    get provideStore() { return $provide(useTodos, store) },
    get injectStore() { return $inject(useTodos, store) },
    todos,
    deleteTodo: tap((id: string) => {
      const todo = store.value.todos.value.find(item => item.id === id)

      todo && store.value.todos.remove(todo)
    }),
    addTodo(label: string) {
      store.value.todos.insert({ id: String(Math.random()), label: $(label), done: $<boolean>(false) })
    },
    setDone(id: string, state: boolean) {
      store.value.todos.value.find(item => item.id === id)?.done.next(state)
    },
    setLabel(id: string, label: string){
      store.value.todos.value.find(item => item.id === id)?.label.next(label)
    },
    toggleDone: tap((id: string) => {
      const todo = store.value.todos.value.find(item => item.id === id)

      todo && todo.done.next(!todo.done.value)
    })
  }
}
