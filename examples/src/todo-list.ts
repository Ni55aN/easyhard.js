import { h, $, $$, $for } from 'easyhard';
import { map } from 'rxjs/operators';
import { Input } from './components/input';

type Task = { text: string, done: boolean };

export default function() {
  const list = new $$<Task>([])
  const target = new $('');

  const add = (text: string) => list.insert(new $({ text, done: false }))
  const remove = (task: $<Task>) => list.remove(task);

  return h('div', {},
    Input({ model: target }),
    h('button', { click() { add(target.value); target.next(''); }}, '+'),
    $for(list, (v) => h('div', {},
        h('b', {}, v.pipe(map(item => item.text))),
        h('button', { click() { remove(v) } }, 'x')
    ))
  );
}