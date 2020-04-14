import { h, Child } from 'easyhard';
import { hot, rerender } from '../../loader/api';

const id = '/src/components/hmr.ts';

export const HMR = hot('HMR', id, (<T extends Child>(value: T) => {
  return h('div', {}, '-fsdsd-', value);
}))

export const HMR2 = hot('HMR2', id, (<T extends Child>(value: T) => {
  return h('div', {}, '-s-', value);
}))

declare var module: any;

if (module.hot) {
  module.hot.accept();
  rerender({ HMR, HMR2 }, id);
}

