import { $, $for, $if, h } from 'easyhard'
import { $$Return, collectionLength, filterCollection, forEachCollection } from 'easyhard-common'
import { combineLatest, Observable, pipe, Subject } from 'rxjs'
import { first, map, mapTo, switchMap, tap } from 'rxjs/operators'
import { Footer } from './footer'
import { not } from '../../utils/observables'
import { Todo, useTodos } from './store'
import { Filter, FilterLink, useFilter } from './filter'
import { Input } from './input'
import { TodoItem } from './item'
import 'todomvc-app-css/index.css'

function TodoList({ todos, filter: todosFilter }: { todos: Observable<$$Return<Todo>>, filter: Observable<Filter> }) {
  const { injectStore, addTodo, setDone, deleteTodo } = useTodos()

  const todosCount = todos.pipe(collectionLength())
  const hasTodos = todosCount.pipe(map(Boolean))

  const activeTodos = todos.pipe(
    filterCollection(data => data.done.pipe(not))
  )
  const doneTodos = todos.pipe(
    filterCollection(data => data.done)
  )

  const activeCount = activeTodos.pipe(collectionLength())
  const doneCount = doneTodos.pipe(collectionLength())

  const visibleTodos = todos.pipe(
    filterCollection(data => combineLatest([todosFilter, data.done]).pipe(
      map(([filter, done]) => filter === 'completed' ? done : (filter === 'active' ? !done : true))
    ))
  )

  const anyDone = doneCount.pipe(map(Boolean))
  const allSelected = combineLatest([todosCount, doneCount]).pipe(map(([visible, done]) => visible === done))

  const toggleAll$ = new Subject<{ current: boolean }>()
  const onToggleAll$ = todos.pipe(
    forEachCollection(item => {
      return toggleAll$.pipe(map(payload => ({ all: payload.current, item })))
    }),
    tap(({ all, item }) => setDone(item.id, !all)),
    mapTo(null)
  )

  const clearCompleted$ = new Subject<MouseEvent>()
  const onClearCompleted$ = doneTodos.pipe(
    forEachCollection(item => {
      return clearCompleted$.pipe(mapTo(item))
    }),
    map(todo => todo.id),
    deleteTodo,
    mapTo(null)
  )

  const input = $('')
  const onAddTodo = (e: KeyboardEvent) => {
    const value = input.value.trim()
    if (e.key === 'Enter' && value) {
      addTodo(value)
      input.next('')
    }
  }

  return (
    h('div', { className: 'todoapp' },
      injectStore,
      onToggleAll$,
      onClearCompleted$,
      h('header', { className: 'header' },
        h('h1', {}, 'todos'),
        Input({
          className:'new-todo',
          placeholder:'What needs to be done?',
          keypress: tap(onAddTodo),
          value: input,
          input: tap(e => input.next((e.target as HTMLInputElement).value || ''))
        })
      ),
      $if(hasTodos, () =>
        h('section', { className: 'main' },
          h('input', {
            id: 'toggle-all',
            type: 'checkbox',
            className: 'toggle-all',
            checked: allSelected,
            change: pipe(switchMap(() => allSelected.pipe(first())), tap(current => toggleAll$.next({ current }))),
          }),
          h('label', { htmlFor: 'toggle-all' }),
          h('ul', { className: 'todo-list'},
            $for(visibleTodos, todo =>  (
              TodoItem({ todo })
            ))
          )
        )
      ),
      $if(hasTodos, () =>
        h('footer', { className: 'footer'},
          h('span', { className: 'todo-count'},
            h('strong', {}, activeCount), activeCount.pipe(map(count => ` item${count === 1 ? '' : 's'} left`)),
          ),
          h('ul', { className: 'filters'},
            h('li', {},
              FilterLink({ type: '' },
                'All'
              )
            ),
            h('li', {},
              FilterLink({ type: 'active' },
                'Active'
              )
            ),
            h('li', {},
              FilterLink({ type: 'completed' },
                'Completed'
              ),
            )
          ),
          $if(anyDone, () =>  (
            h('button', {
              className: 'clear-completed',
              click: clearCompleted$
            },
            'Clear completed'
            )
          ))
        )
      )
    )
  )
}

function App() {
  const filter = useFilter()
  const { provideStore, todos } = useTodos()

  const hasTodos = todos.pipe(collectionLength(), map(Boolean))

  return h('div', {},
    provideStore,
    TodoList({ todos, filter }),
    $if(hasTodos, Footer)
  )
}

document.body.appendChild(App())
