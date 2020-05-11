import { h } from 'easyhard';
import { HMR } from '../components/hmr';
import { HMR2 } from '../components/hmr2';
import { interval } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

function App() {
  const val = interval(1000).pipe(shareReplay(1));
  const val2 = interval(500).pipe(shareReplay(1));
  const val3 = interval(250).pipe(shareReplay(1));
  const val4 = interval(100).pipe(shareReplay(1));

  return h('div', {},
    h('p', {}, '--------'),
    HMR(val),
    HMR(val2),
    HMR2(val3),
    HMR2(val4)
  );
}

document.body.appendChild(App());