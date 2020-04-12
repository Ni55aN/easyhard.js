import { h, appendChild } from 'easyhard';
import { HMR } from '../components/hmr';
import { interval } from 'rxjs';

function App() {
  const val = interval(500);

  return h('div', {},
    h('p', {}, '--------'),
    HMR(val)
  );
}

declare var module: any;

if (module.hot) {
  module.hot.accept('../components/hmr.ts', function() {
    const meta = (window as any).hmrMeta;
    const { el: oldEl, args } = meta['/src/components/hmr.ts'][0];
    const parentNode = oldEl.parentElement;
    appendChild((HMR as any)(...args), parentNode, oldEl);
    parentNode.removeChild(oldEl);
    meta['/src/components/hmr.ts'].splice(0, 1);
    
    console.log(`Accepting the updated hmr.ts module!`);
  })
}



document.body.appendChild(App());