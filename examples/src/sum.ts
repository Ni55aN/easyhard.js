import { h, $ } from 'easyhard';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Input } from './components/input';

export default function(container: HTMLElement) {
  const a = new $(0);
  const b = new $(0);
  const sum = combineLatest(a, b).pipe(map(([a, b]) => a + b));

  container.appendChild(
    h('div', {},
      h(Input, { model: a, type: 'number' }),
      ' + ',
      h(Input, { model: b, type: 'number' }),
      ' = ',
      sum
    )
  );
}