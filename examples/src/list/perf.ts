import { h, $, $$, $for } from 'easyhard';

function App() {
  const list = new $$(new Array(10000).fill(null).map((_, i) => new $(i)));
  const increment = () => list.value.forEach(v => v.next(v.value + 1));

  return h('div', {},
    h('button', { click: increment }, 'inc'),
    $for(list, (v) => h('div', {}, v))
  );
}

document.body.appendChild(App());