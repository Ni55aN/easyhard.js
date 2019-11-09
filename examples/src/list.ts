import { h, $, $$, $for } from 'easyhard';

export default function(container: HTMLElement) {
  const arr = new Array(10).fill(0).map((_, i) => i);
  const list = new $$(arr.map(v => new $(v)));

  setInterval(() => {
      const i = Math.floor(Math.random() * (list.length - 1));
      const subj = list.value[i];

      subj.next(subj.value + 1);
  }, 500);

  container.appendChild(
    h('div', {}, 
        $for(list, (v) => h('div', {}, v))
    )
  );
}