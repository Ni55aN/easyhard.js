import { Observable } from "rxjs";

export type DomElement = Comment | HTMLElement | Text | null;
export type Directive = (parent: ChildNode) => Child;
export type SimpleType = number | string | boolean | null | void;
export type Child = DomElement | Directive | Observable<SimpleType | DomElement> | SimpleType;

export type EventAttrs<K extends keyof HTMLElementTagNameMap> = {[key in keyof HTMLElementEventMap]?: Parameters<HTMLElementTagNameMap[K]['addEventListener']>[1]};
export type PropAttrs<K extends keyof HTMLElementTagNameMap> = {[key in keyof HTMLElementTagNameMap[K]]?: Observable<unknown> | unknown};
export type Attrs<K extends keyof HTMLElementTagNameMap> = EventAttrs<K> & PropAttrs<K>;
export type TagName = keyof HTMLElementTagNameMap;
