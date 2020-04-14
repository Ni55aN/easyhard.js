import { h } from 'easyhard';
import { HMR, HMR2 } from '../components/hmr';
import { interval } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

function App() {
  const val = interval(500).pipe(shareReplay(1));

  return h('div', {},
    h('p', {}, '--------'),
    HMR(val),
    HMR2(val)
  );
}

document.body.appendChild(App());