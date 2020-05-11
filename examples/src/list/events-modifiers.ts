import { h, $ } from 'easyhard'
import { debounceTime, first } from 'rxjs/operators';
import { OperatorFunction, Subject } from 'rxjs';

function pipeEvent(pipe: OperatorFunction<any, any>, handler: (e: Event) => void) {
  const subject = new Subject()
  subject.pipe(pipe).subscribe(handler); // TODO unsubscribe

  return (e: Event) => {
    subject.next(e);
  }
}

function App() {
  const move = $(0)

  return h('div', {},
    h('button', { click: pipeEvent(first(), () => alert('Clicked once'))}, 'Click'),
    h('div', { style: 'padding: 2em; background: #ffa760', mousemove: pipeEvent(debounceTime(100), () => move.next(move.value + 1)) }, 'Move', '[', move, ']')
  )
}

document.body.appendChild(App());