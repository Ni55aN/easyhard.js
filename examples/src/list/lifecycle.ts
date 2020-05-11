import { h, $, $if } from 'easyhard';
import { Observable, interval, Observer } from 'rxjs';
import { map, tap, mergeMap } from 'rxjs/operators';

function Child(text: Observable<string>) {
  const mountInfo = Observable.create((observer: Observer<any>) =>{
    console.info('onMount');
    return () => console.info('onDestroy');
  });
  console.info('onCreate')

  return h('div', {},
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