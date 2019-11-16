import { Observable } from "rxjs";
import { Fragment } from "./fragment";

export type DomElement = Comment | HTMLElement | Text | null;
export type FunctionalChild = (parent: ChildNode) => DomElement | Fragment;
export type Child = DomElement | Fragment | FunctionalChild | Observable<any> | string | number | boolean;
export type Attrs = {[key: string]: any};