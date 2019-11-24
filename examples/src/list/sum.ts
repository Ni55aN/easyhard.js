import { h, $ } from 'easyhard';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Input } from '../components/input';

function App() {
  const a = new $(0);
  const b = new $(0);
  const sum = combineLatest(a, b).pipe(map(([a, b]) => a + b));

  return h('div', {},
    Input({ model: a, type: 'number' }),
    ' + ',
    Input({ model: b, type: 'number' }),
    ' = ',
    sum
  );
}

document.body.appendChild(App());