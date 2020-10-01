import { h, $, $if, onMount, onDestroy } from 'easyhard';
import { Observable, interval, Observer } from 'rxjs';
import { map, tap } from 'rxjs/operators';

function Child(text: Observable<string>) {
  const mountInfo = new Observable((observer: Observer<any>) =>{
    console.info('onMount (legacy)');
    return () => console.info('onDestroy (legacy)');
  });
  console.info('onCreate')

  const container = document.createElement('div')

  onMount(container, () => console.info('onMount (html)'))
  onDestroy(container, () => console.info('onDestroy (html)'))

  return h('div', {},
    container,
    onMount(() => console.info('onMount')),
    onDestroy(() => console.info('onDestroy')),
    mountInfo,
    text.pipe(tap(() => console.info('onUpdate')))
  )
}


function App() {
  const text = interval(100).pipe(map(n => `number: ${n}`));
  const mount = $(true)

  return h('div', {},
    h('button', { click() {  mount.next(!mount.value) }}, 'toggle'),
    $if(mount, map(() => Child(text)))
  );
}

document.body.appendChild(App());