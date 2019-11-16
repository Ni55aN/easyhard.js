import { createElement } from "./core";
import { Child, Attrs } from "./types";

export function createElementX<T extends (...args: any) => any, Props extends Parameters<T>[0]>(tag: T | string, attrs: Props, ...children: Child[]): HTMLElement;
export function createElementX(tag: string, attrs: Attrs, ...children: Child[]): HTMLElement
export function createElementX<T extends (...args: any) => any, Props extends Parameters<T>[0]>(tag: T | string, attrs: Props | Attrs, ...children: Child[]): HTMLElement {
  if (typeof tag === "function") {
    return tag(attrs);
  }

  return createElement(tag, attrs, ...children);
}