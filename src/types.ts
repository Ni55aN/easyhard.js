import { Observable } from "rxjs";
import { Fragment } from "./fragment";

export abstract class Component {
    abstract render(): DomElement;
}
export type DomElement = Comment | HTMLElement | Text | null;
export type Directive = (parent: ChildNode) => DomElement | Fragment;
export type SimpleType = number | string | boolean | null | void;
export type Child = DomElement | Component | Fragment | Directive | Observable<SimpleType | DomElement> | SimpleType;

export type EventAttrs<K extends keyof HTMLElementTagNameMap> = {[key in keyof HTMLElementEventMap]?: Parameters<HTMLElementTagNameMap[K]['addEventListener']>[1]};
export type PropAttrs<K extends keyof HTMLElementTagNameMap> = {[key in keyof HTMLElementTagNameMap[K]]?: Observable<unknown> | unknown};
export type Attrs<K extends keyof HTMLElementTagNameMap> = EventAttrs<K> & PropAttrs<K>;
export type TagName = keyof HTMLElementTagNameMap;
