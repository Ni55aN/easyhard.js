import { h, $if } from 'easyhard';
import { Observable, interval, Observer } from 'rxjs';
import { map } from 'rxjs/operators';

export default function() {
  const mount = interval(1000).pipe(map(time => time % 2));
  const lifecycle = Observable.create((observer: Observer<any>) =>{
    console.log('mount');

    return () => console.log('destroy');
  });

  return h('div', {},
    $if(mount, () => lifecycle)
  );
}

