import { DomElement } from "./types";

export function insertAfter(newNode: Node, parentNode: Node, referenceNode: DomElement): void {
    parentNode.insertBefore(newNode, referenceNode && referenceNode.nextSibling);
}