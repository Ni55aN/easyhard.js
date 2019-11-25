import { h, $, $$, $for } from 'easyhard';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';

function App() {
  const list = new $$([]);
  const randomList = timer(0, 16).pipe(
    map(() => {
        list.insert(new $(0));
      
        return null;
    })
  );

  return h('div', {},
    randomList,
    $for(list, (v) => h('div', {}, v))
  );
}

document.body.appendChild(App());