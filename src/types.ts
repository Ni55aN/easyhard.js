import { Fragment } from "./fragment";

export type DomElement = Comment | HTMLElement | Text | null;
export type FunctionalChild = (parent: ChildNode) => DomElement | Fragment;
export type Attrs = {[key: string]: any};