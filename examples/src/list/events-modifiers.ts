import { h, $ } from 'easyhard'
import { debounceTime, first, tap, takeUntil } from 'rxjs/operators';
import { Subject, pipe } from 'rxjs';

function Counter() {
  const n = $(0)
  const blockEvent = new Subject<MouseEvent>()

  return h('div', {},
    h('button', { click: blockEvent }, 'Block'),
    h('button', { click: pipe(takeUntil(blockEvent), tap(() => n.next(n.value + 1))) }, n)
  )
}

function App() {
  const move = $(0)

  return h('div', {},
    h('button', { click: pipe(first(), tap(() => alert('Clicked once'))) }, 'Click'),
    h('div', { style: 'padding: 2em; background: #ffa760', mousemove: pipe(debounceTime(100), tap(() => move.next(move.value + 1))) }, 'Move', '[', move, ']'),
    Counter()
  )
}

document.body.appendChild(App());