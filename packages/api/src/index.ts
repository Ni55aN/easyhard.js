import { appendChild } from 'easyhard';

type Component = Comment | HTMLElement | Text
type Item = { element: Component, args: unknown[] }

const storage: {[key: string]: {[key: string]: Item[]}} = {};

function trackComponent<T extends Item>(id: string, name: string, data: T) {
  if (!storage[id]) storage[id] = {}; 
  if (!storage[id][name]) storage[id][name] = [];

  (storage[id][name] as T[]).push(data);
}

function getTrackedComponents(id: string): [string, Item][] {
  if (!storage || !storage[id]) return [];

  return Object.entries(storage[id]).reduce((acc, [name, items]) => {
    return [...acc, ...items.map(item => [name, item] as [string, Item])]
  }, [] as [string, Item][])
}

function removeTrackedComponent(id: string, name: string, item: Item) {
  const items = storage[id][name];

  items.splice(items.indexOf(item), 1);
}

export function hot<A extends unknown[]>(name: string, id: string, component: (...args: A) => Component): () => Component {
  function wrapper(...args: A) {
    const element = component(...args);
    trackComponent(id, name, { element, args });
    return element;
  }
  return wrapper;
}

export function rerender(components: {[key: string]: (...args: unknown[]) => Component}, id: string): void {
  const entries = getTrackedComponents(id);
  const existEntries = entries.filter(([_, item]) => item.element.parentElement);

  existEntries.forEach(([name, item]) => {
    const parentNode = item.element.parentElement;
    const component = components[name]
    const newElement = component(...item.args);

    if (!parentNode) throw new Error('parentNode is undefined')

    appendChild(newElement, parentNode, item.element);
    parentNode.removeChild(item.element);
    removeTrackedComponent(id, name, item);
  });
}
