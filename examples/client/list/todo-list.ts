import { h, $, $$, $for, $if } from 'easyhard'
import { map, tap } from 'rxjs/operators'
import { Input } from '../components/input'

type Reactive<T> = {[key in keyof T]: $<T[key]>};
type Task = Reactive<{ text: string, done: boolean }>;

function Editable(el: (toggle: () => void) => HTMLElement, input: (toggle: () => void) => HTMLElement) {
  const edited = $(false)
  const toggle = () => edited.next(!edited.value)

  return $if(edited,
    map(() => input(toggle)),
    map(() => el(toggle))
  )
}

function TodoItem({ item, remove }: { item: $<Task>, remove: (task: $<Task>) => void }) {
    const done = item.value.done
    const text = item.value.text

    return h('div', {},
      Editable(
        (toggle) => h('b', {
          style: done.pipe(map(done => done ? 'text-decoration: line-through;' : '' )),
          click: tap(() => done.next(!done.value)),
          contextmenu: tap((e: Event) => { e.preventDefault(); toggle() })
        }, text),
        (toggle) => Input({
          model: text,
          autofocus: true,
          events: { blur: toggle }
        })
      ),
      h('button', { click: tap(() => remove(item)) }, 'x')
  )
}

function App() {
  const list = $$<$<Task>>([])
  const target = $('')

  const add = (text: string) => list.insert($({ text: $(text), done: $(false as boolean) }))
  const remove = (task: $<Task>) => list.remove(task)

  return h('div', {},
    Input({ model: target }),
    h('button', { click: tap(() => { add(target.value); target.next('')}) }, '+'),
    $for(list, map(item => TodoItem({ item, remove })))
  )
}

document.body.appendChild(App())
