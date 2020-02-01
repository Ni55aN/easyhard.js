import { h, $, $$, $for } from 'easyhard';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';

function App() {
  const arr = new Array(10).fill(0).map((_, i) => i);
  const list = new $$(arr.map(v => new $(v)));
  const randomList = timer(0, 500).pipe(
    map(() => {
      const i = Math.floor(Math.random() * (list.length - 1));
      const subj = list.value[i];

      return subj.next(subj.value + 1);
    })
  );

  return h('div', {},
    randomList,
    $for(list, (v) => h('div', {}, v))
  );
}

document.body.appendChild(App());