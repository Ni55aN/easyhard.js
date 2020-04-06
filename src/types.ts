import { Observable } from "rxjs";

export type Anchor = Text & { edge?: DomElement };
export type DomElement = Anchor | Comment | HTMLElement | Text | null;
export type SimpleType = number | string | boolean | null | void;
export type Child = DomElement | SimpleType | Observable<SimpleType | DomElement>;

export type EventAttrs<K extends keyof HTMLElementTagNameMap> = {[key in keyof HTMLElementEventMap]?: Parameters<HTMLElementTagNameMap[K]['addEventListener']>[1]};
export type PropAttrs<K extends keyof HTMLElementTagNameMap> = {[key in keyof HTMLElementTagNameMap[K]]?: Observable<unknown> | unknown};
export type Attrs<K extends keyof HTMLElementTagNameMap> = EventAttrs<K> & PropAttrs<K>;
export type TagName = keyof HTMLElementTagNameMap;
