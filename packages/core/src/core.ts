/* eslint-disable @typescript-eslint/no-use-before-define */
import { Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { DomElement, Attrs, Child, PropAttrs, TagName } from "./types";
import { insertNode, createAnchor } from "./utils";
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
        element.addEventListener(name, attr as unknown as EventListenerObject);
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
    insertNode(el, parent, after);
  }
  return el;
}

function resolveChild(child: Child): DomElement {
  if (child instanceof Observable) {
    const anchor = createAnchor();

    child.pipe(untilExist(anchor), distinctUntilChanged()).subscribe(v => {
      anchor.edge && anchor.edge.remove();
      anchor.textContent = '';

      if (v instanceof Comment || v instanceof HTMLElement || v instanceof Text) {
        anchor.edge = v;
        insertNode(anchor.edge, anchor.parentNode as Node, anchor);
      } else {
        anchor.textContent = v as string;
      }
    }, null, () => anchor.edge && anchor.edge.remove());

    return anchor;
  }

  if (typeof child !== "object") {
    return document.createTextNode(String(child));
  }

  return child;
}
