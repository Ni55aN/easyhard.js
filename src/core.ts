/* eslint-disable @typescript-eslint/no-use-before-define */
import { Observable } from "rxjs";
import { DomElement, Attrs, Child, PropAttrs, TagName } from "./types";
import { Fragment } from "./fragment";
import { insertAfter } from "./utils";
import { untilExist } from "./operators";

export function createElement<K extends TagName>(tag: K, attrs: Attrs<K>, ...children: Child[]): HTMLElement {
  const element = document.createElement(tag);

  for (const name in attrs) {
    if (name && attrs.hasOwnProperty(name)) {
      const attr = attrs[name as keyof Attrs<K>];
      const attrName = name as keyof PropAttrs<K>;

      if (attr === true) {
        element[attrName] = true as any;
      } else if (attr instanceof Observable) {
        attr.pipe(untilExist(element)).subscribe(value => {
          element[attrName] = value;
        });
      } else if (typeof attr === "function") {
        element.addEventListener(name, attr as EventListenerObject);
      } else if (attr !== false && attr != null) {
        element[attrName] = attr as any;
      }
    }
  }

  for (const child of children) {
    appendChild(child, element);
  }

  return element;
}

export function appendChild(child: Child, parent: ChildNode, after: Fragment | DomElement = null): DomElement | Fragment {
  if (child instanceof Function) {
    return appendChild(child(parent), parent, after);
  } else {
    const el = resolveChild(child);
    if (el) {
      if (after) {
        insertAfter(el instanceof Fragment ? el.getRoot() : el, parent, after instanceof Fragment ? after.getEdge() : after);
      } else {
        parent.appendChild(el instanceof Fragment ? el.getRoot() : el);
      }
    }
    return el;
  }
}

function resolveChild(child: Child): DomElement | Fragment {
  if (child instanceof Observable) {
    const text = document.createTextNode('');
    let element: HTMLElement;

    child.pipe(untilExist(text)).subscribe(v => {
      element && element.remove();
      text.textContent = '';

      if (v instanceof HTMLElement) {
        element = v;
        insertAfter(element, text.parentNode as Node, text);
      } else {
        text.textContent = v as string;
      }
    });

    return text;
  }

  if (child instanceof Fragment) {
    return child;
  }
  
  if (typeof child !== "object") {
    return document.createTextNode(String(child));
  }

  if (child && 'render' in child) {
    return child.render();
  }

  return child;
}
