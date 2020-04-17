import { appendChild } from 'easyhard';

const storage = {};

function trackComponent(id, name, data) {
  if (!storage[id]) storage[id] = {}; 
  if (!storage[id][name]) storage[id][name] = [];

  storage[id][name].push(data);
}

function getTrackedComponents(id) {
  if (!storage || !storage[id]) return [];
  
  return Object.entries(storage[id]).reduce((acc, [name, items]) => {
    return [...acc, ...items.map(item => [name, item])]
  }, [])
}

function removeTrackedComponent(id, name, item) {
  const items = storage[id][name];

  items.splice(items.indexOf(item), 1);
}

export function hot(name, id, component) {
  function wrapper(...args) {
    const element = component(...args);
    trackComponent(id, name, { element, args });
    return element;
  }
  return wrapper;
}

export function rerender(components, id) {
  const entries = getTrackedComponents(id);
  const existEntries = entries.filter(([_, item]) => item.element.parentElement);

  existEntries.forEach(([name, item]) => {
    const parentNode = item.element.parentElement;
    const newElement = components[name](...item.args);

    appendChild(newElement, parentNode, item.element);
    parentNode.removeChild(item.element);
    removeTrackedComponent(id, name, item);
  });
}