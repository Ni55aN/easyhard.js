export function hot<T extends (...args: any[]) => any>(name: string, id: string, component: T): T;
export function rerender(components: {[key: string]: Function}, id: string);