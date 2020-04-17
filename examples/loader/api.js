import { appendChild } from 'easyhard';

export function hot(name, id, component) {
  function wrapper(...args) {
    const el = component(...args);
    if (!global.hmrMeta) global.hmrMeta = {};
    if (!global.hmrMeta[id]) global.hmrMeta[id] = {}; 
    if (!global.hmrMeta[id][name]) global.hmrMeta[id][name] = [];  
    global.hmrMeta[id][name].push({ el, args });
    return el;
  }
  return wrapper;
}

export function rerender(components, id) {
  if (global.hmrMeta && global.hmrMeta[id])
  Object.entries(global.hmrMeta[id]).forEach(([name, items]) => {
    items.slice().forEach(item => {
      const { el: oldEl, args } = item;
      const parentNode = oldEl.parentElement;
      if (!parentNode) return;
      const el = components[name](...args);
      appendChild(el, parentNode, oldEl);
      parentNode.removeChild(oldEl);
      items.splice(items.indexOf(item), 1);
    });
  });
}