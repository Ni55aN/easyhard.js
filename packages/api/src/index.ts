import { appendChild } from 'easyhard';

const storage: any = {};

function trackComponent(id: string, name: string, data: any) {
  if (!storage[id]) storage[id] = {}; 
  if (!storage[id][name]) storage[id][name] = [];

  storage[id][name].push(data);
}

function getTrackedComponents(id: string) {
  if (!storage || !storage[id]) return [];
  
  return Object.entries(storage[id]).reduce((acc: any, [name, items]: any) => {
    return [...acc, ...items.map((item: any) => [name, item])]
  }, [])
}

function removeTrackedComponent(id: string, name: string, item: any) {
  const items = storage[id][name];

  items.splice(items.indexOf(item), 1);
}

export function hot(name: string, id: string, component: any) {
  function wrapper(...args: any[]) {
    const element = component(...args);
    trackComponent(id, name, { element, args });
    return element;
  }
  return wrapper;
}

export function rerender(components: any[], id: string): void {
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
