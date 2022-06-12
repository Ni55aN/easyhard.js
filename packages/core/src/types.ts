import { Observable, OperatorFunction, Subject } from 'rxjs'

export type Anchor = Text & { edge?: DomElement };
export type DomElement = Anchor | Comment | HTMLElement | Text | null;
export type SimpleType = number | string | boolean | null | void;
export type Child = DomElement | SimpleType | Observable<Child>;
export type NestedChild = Child | NestedChild[];

export type TagName = keyof HTMLElementTagNameMap;
export type EventName = keyof HTMLElementEventMap;
export type ElementType<T extends TagName> = HTMLElementTagNameMap[T];

export type EventHandler<K extends EventName> = OperatorFunction<HTMLElementEventMap[K], unknown> | Subject<HTMLElementEventMap[K]>
export type EventAttrs = { [key in EventName]?: EventHandler<key> };
export type PropAttrs<K extends TagName> = { [key in keyof HTMLElementTagNameMap[K]]?: Observable<unknown> | unknown };
export type Attrs<K extends TagName> = EventAttrs & PropAttrs<K>;
