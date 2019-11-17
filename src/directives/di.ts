import { Observable } from "rxjs";
import { default as $ } from '../structures/value';
import { Directive } from "../types";
import { overrideRemove } from "../core";


type DiKey<T> = { new(): T } | Object;
type DiValue<T> = T | Observable<T> | null;

const injections = new WeakMap<ChildNode, Map<DiKey<any>, any>>();

function getInjection<T>(id: DiKey<T>, parent: ChildNode | null): DiValue<T> {
    if (!parent) return null;
    const inj = injections.get(parent);

    return inj && inj.get(id) || getInjection(id, parent.parentElement);
}

export function $provide<T extends any>(type: DiKey<T>, value: DiValue<T>): Directive {
    return (parent) => {
        let map = injections.get(parent);
        if (!map) {
            map = new Map();
            injections.set(parent, map);
        }
        map.set(type, value);
        return null;
    }
}

export function $inject<T extends any>(id: DiKey<T>, act: $<T> | ((arg: T) => void)): Directive {
    return (parent) => {
        requestAnimationFrame(() => { // access parent element after it added to DOM
            const val: any = getInjection<T>(id, parent);
            
            if (val instanceof Observable) {
                const sub = val.subscribe(value => {
                    act instanceof $ ? act.next(value)  : act(value);
                })
                overrideRemove(parent, () => sub.unsubscribe());
            } else {
                act instanceof $ ? act.next(val) : act(val);
            }
        });
        return null;
    };
}
