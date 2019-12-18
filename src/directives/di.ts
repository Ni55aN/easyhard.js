import { Observable } from "rxjs";
import { default as $ } from '../structures/value';
import { Directive } from "../types";
import { untilExist } from "../operators";


type DiKey<T> = { new(): T } | {};
type DiValue<T> = $<T>;
type DiInjection<T> = null | { value: DiValue<T> };

const injections = new WeakMap<ChildNode, Map<DiKey<unknown>, unknown>>();

function getInjection<T>(id: DiKey<T>, parent: ChildNode | null): DiInjection<T> {
    if (!parent) return null;

    const inj = injections.get(parent);
    if (inj && inj.get(id)) return { value: inj.get(id) as DiValue<T> };

    return getInjection(id, parent.parentElement);
}

export function $provide<T extends unknown>(type: DiKey<T>, value: DiValue<T>): Directive {
    return (parent: ChildNode): null => {
        let map = injections.get(parent);
        if (!map) {
            map = new Map();
            injections.set(parent, map);
        }
        map.set(type, value);
        return null;
    }
}

export function $inject<T extends unknown>(id: DiKey<T>, act: DiValue<T>): Directive {
    return (parent: ChildNode): null => {
        requestAnimationFrame(() => { // access parent element after it added to DOM
            const injection: DiInjection<T> = getInjection<T>(id, parent && parent.parentElement);
            
            if (!injection) return;
            if (injection.value instanceof Observable) {
                injection.value.pipe(untilExist(parent)).subscribe(value => act.next(value));
            } else {
                act.next(injection.value);
            }
        });
        return null;
    };
}
