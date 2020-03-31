/* eslint-disable @typescript-eslint/no-use-before-define */
import { Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { DomElement, Attrs, Child, PropAttrs, TagName } from "./types";
import { insertAfter } from "./utils";
import { untilExist } from "./operators";

type NestedChild = Child | NestedChild[];

export function createElement<K extends TagName>(tag: K, attrs: Attrs<K>, ...children: NestedChild[]): HTMLElement {
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

  for (const child of children.flat(Infinity) as Child[]) {
    appendChild(child, element);
  }

  return element;
}

export function appendChild(child: Child, parent: ChildNode, after: DomElement = null): DomElement {
  const el = resolveChild(child);
  if (el) {
    if (after) {
      insertAfter(el, parent, after);
    } else {
      parent.appendChild(el);
    }
  }
  return el;
}

function resolveChild(child: Child): DomElement {
  if (child instanceof Observable) {
    const text = document.createTextNode('');
    let element: Comment | HTMLElement | Text;

    child.pipe(untilExist(text), distinctUntilChanged()).subscribe(v => {
      element && element.remove();
      text.textContent = '';

      if (v instanceof Comment || v instanceof HTMLElement || v instanceof Text) {
        element = v;
        insertAfter(element, text.parentNode as Node, text);
      } else {
        text.textContent = v as string;
      }
    }, null, () => element && element.remove());

    return text;
  }

  if (typeof child !== "object") {
    return document.createTextNode(String(child));
  }

  return child;
}
