import { Observable } from "rxjs";
import { Fragment } from "./fragment";

export abstract class Component {
    abstract render(): DomElement;
}
export type DomElement = Comment | HTMLElement | Text | null;
export type Directive = (parent: ChildNode) => DomElement | Fragment;
export type Child = DomElement | Component | Fragment | Directive | Observable<any> | string | number | boolean | null;
export type Attrs = {[key: string]: any};