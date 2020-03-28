import { h, $ } from 'easyhard';
import { map } from 'rxjs/operators';

function App() {
  const b = $('');

  return h('div', {}, b.pipe(map(() => h('b', {}, Math.random()))));
}

document.body.appendChild(App());