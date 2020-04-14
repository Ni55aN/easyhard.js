import { appendChild } from 'easyhard';

export function hot(name, id, component) {
  function wrapper(...args) {
    const el = component(...args);
    if (!global.hmrMeta) global.hmrMeta = {};
    if (!global.hmrMeta[id]) global.hmrMeta[id] = {};    
    global.hmrMeta[id][name] = { el, args };
    return el;
  }
  return wrapper;
}

export function rerender(components, id) {
  if (global.hmrMeta && global.hmrMeta[id])
  Object.entries(global.hmrMeta[id]).forEach(([key, { el: oldEl, args }]) => {
    const parentNode = oldEl.parentElement;
    const el = components[key](...args);
    appendChild(el, parentNode, oldEl);
    parentNode.removeChild(oldEl);
  });
}