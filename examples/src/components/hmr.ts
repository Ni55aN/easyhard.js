import { h, Child } from 'easyhard';


const id = '/src/components/hmr.ts';

if (!(window as any).hmrMeta) (window as any).hmrMeta = {};
if (!(window as any).hmrMeta[id]) (window as any).hmrMeta[id] = [];


function hot<T extends (...args: any[]) => any>(component: T): T {
  function wrapper(...args: any[]): any {
    const el = component(...args);
    (window as any).hmrMeta[id].push({ el, args })
    return el;
  }
  return wrapper as any;
}

export const HMR = hot((<T extends Child>(value: T) => {
  return h('div', {}, '-assssa-', value);
}))
