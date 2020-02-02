import { h, $if } from 'easyhard';
import { Observable, interval, Observer } from 'rxjs';
import { map } from 'rxjs/operators';

function App() {
  const mount = interval(1000).pipe(map(time => time % 2 === 1));
  const lifecycle = Observable.create((observer: Observer<any>) =>{
    console.log('mount');

    return () => console.log('destroy');
  });

  return h('div', {},
    $if(mount, map(() => h('div', {}, '--')))
  );
}

document.body.appendChild(App());