import { Observable } from "rxjs";
import { Fragment } from "./fragment";

export type DomElement = Comment | HTMLElement | Text | null;
export type Directive = (parent: ChildNode) => DomElement | Fragment;
export type Attrs = {[key: string]: any};