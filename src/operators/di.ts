import { $ } from '../structures/value';
import { untilExist } from './until-exist';
import { Child } from '../types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type DiKey<T> = { new(): T } | {};
type DiValue<T> = $<T>;
type DiInjection<T> = WeakMap<Node, T>;

class Injections {
    map = new WeakMap<DiKey<unknown>, DiInjection<any>>();
    list$ = $<Node | null>(null);

    observe<T>(id: DiKey<T>): Observable<DiInjection<T>> {
        return this.list$.pipe(
            map(() => this.getNodeMap(id))
        );
    }

    next<T>(id: DiKey<T>, node: Node, value: T): void {
        this.getNodeMap(id).set(node, value);
        this.list$.next(null);
    }

    private getNodeMap<T>(id: DiKey<T>): DiInjection<T> {
        let m = this.map.get(id);

        if (!m) {
            m = new WeakMap();
            this.map.set(id, m);
        }
        return m;
    }

    static find<T>(el: Node | null, data: DiInjection<T>): T | null {
        return el && data.get(el) || el && this.find(el.parentElement, data);
    }
}

const injections = new Injections();

export function $provide<T extends unknown>(id: DiKey<T>, value: DiValue<T>): Child {
    const anchor = document.createTextNode('');

    value.pipe(untilExist(anchor)).subscribe(value => {
        if (!anchor.parentNode) throw new Error('parentNode is undefined')
        injections.next(id, anchor.parentNode, value as any);
    });

    return anchor;
}

export function $inject<T extends unknown>(id: DiKey<T>, act: DiValue<T>): Child {
    const anchor = document.createTextNode('');
    const injection = injections.observe(id);

    injection.pipe(untilExist(anchor)).subscribe((injectionValue: DiInjection<T>) => {
        const target = anchor.parentNode;
        if (!target) return;
        
        const value = Injections.find(target.parentElement, injectionValue);

        if (value) {
            act.next(value);
        }
    });

    return anchor;
}
