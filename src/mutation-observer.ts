import { getNested } from "./utils";
import { Subscriber } from "rxjs";

const observers = new WeakMap<Node, { observer: Subscriber<unknown>; value: unknown }>();
const status = { connected: false };

const observer = new MutationObserver((mutationsList: MutationRecord[]) => {
  for(const record of mutationsList) {
    for (const addedNode of getNested(record.addedNodes)) {
      const subscription = observers.get(addedNode);

      if (subscription) {
        subscription.observer.next(subscription.value);
      }
    }
    for (const removedNode of getNested(record.removedNodes)) {
      const subscription = observers.get(removedNode);

      if (subscription) {
        subscription.observer.complete();
        observers.delete(removedNode);
      }
    }
  }
});

export function connectObserver(container = document.body) {
    observer.observe(container, { childList: true, subtree: true });
    status.connected = true;
}

export function disconnectObserver() {
    observer.disconnect();
    status.connected = false;
}

export function observeElement(el: Node, observer: Subscriber<unknown>, value: unknown) {
    if (!status.connected) { connectObserver(); }
    observers.set(el, { observer, value });
}