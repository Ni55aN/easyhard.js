import { getNested } from "./utils";
import { Subscriber } from "rxjs";

export const NOT_INITED_VALUE = Symbol()

const observers = new WeakMap<Node, { observer: Subscriber<unknown>; value: () => unknown }[]>();
const status = { connected: false };

const observer = new MutationObserver((mutationsList: MutationRecord[]) => {
  for(const record of mutationsList) {
    for (const addedNode of getNested(record.addedNodes)) {
      const subscription = observers.get(addedNode);

      if (subscription) {
        subscription.forEach(s => {
          const value = s.value();
          if (value !== NOT_INITED_VALUE) s.observer.next(value);
        })
      }
    }
    for (const removedNode of getNested(record.removedNodes)) {
      const subscription = observers.get(removedNode);

      if (subscription) {
        subscription.forEach(s => s.observer.complete());
        observers.delete(removedNode);
      }
    }
  }
});

export function disconnectObserver(): void {
  observer.disconnect();
  status.connected = false;
}

export function connectObserver(container = document.body): void {
  disconnectObserver();
  observer.observe(container, { childList: true, subtree: true });
  status.connected = true;
}
export function observeElement(el: Node, observer: Subscriber<unknown>, value: () => unknown): void {
  if (!status.connected) { connectObserver(); }

  const list = observers.get(el);

  if (list) {
    list.push({ observer, value });
  } else {
    observers.set(el, [{ observer, value }])
  }
}