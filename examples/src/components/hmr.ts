import { h, Child, appendChild } from 'easyhard';


const id = '/src/components/hmr.ts';

if (!(global as any).hmrMeta) (global as any).hmrMeta = {};
if (!(global as any).hmrMeta[id]) (global as any).hmrMeta[id] = {};

function hot<T extends (...args: any[]) => any>(name: string, component: T): T {
  function wrapper(...args: any[]): any {
    const el = component(...args);
    (global as any).hmrMeta[id][name] = { el, args };
    return el;
  }
  return wrapper as any;
}

export const HMR = hot('HMR', (<T extends Child>(value: T) => {
  return h('div', {}, '-cccsd-', value);
}))

export const HMR2 = hot('HMR2', (<T extends Child>(value: T) => {
  return h('div', {}, '-ccccccc-', value);
}))

declare var module: any;

if (module.hot) {
  module.hot.accept();
  Object.entries((global as any).hmrMeta[id]).forEach(([key, { el: oldEl, args }]: any) => {
    const parentNode = oldEl.parentElement;
    const el = (key === 'HMR' ? (HMR as any) : (HMR2 as any))(...args);
    appendChild(el, parentNode, oldEl);
    parentNode.removeChild(oldEl);
  });
}

