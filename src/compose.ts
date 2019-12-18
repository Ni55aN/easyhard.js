import { Directive, DomElement } from "./types";
import { Fragment } from "./fragment";

type D = Directive;
type H = HTMLElement;

export function compose(...directives: D[]): D;
export function compose(d1: D, child: H): H;
export function compose(d1: D, d2: D, child: H): H;
export function compose(d1: D, d2: D, d3: D, child: H): H;
export function compose(d1: D, d2: D, d3: D, d4: D, child: H): H;
export function compose(d1: D, d2: D, d3: D, d4: D,  d5: D, child: H): H;
export function compose(d1: D, d2: D, d3: D, d4: D,  d5: D, d6: D, child: H): H;
export function compose(d1: D, d2: D, d3: D, d4: D,  d5: D, d6: D, d7: D, child: H): H;
export function compose(...args: (D | H)[]): H | D {
  const directives = args.slice(0, args.length - 1) as D[];
  const target = args[args.length - 1];

  if (target instanceof HTMLElement) {
    directives.forEach(directive => directive(target))
    return target;
  }

  return (parent: ChildNode): DomElement | Fragment | null => {
    const results = [...directives, target].map(directive => directive(parent));

    return results[0] || null;
  };
}