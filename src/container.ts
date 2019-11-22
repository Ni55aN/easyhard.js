import { Directive } from "./types";

type D = Directive;
type H = HTMLElement;

export function createContainer(d1: D, child: H): H;
export function createContainer(d1: D, d2: D, child: H): H;
export function createContainer(d1: D, d2: D, d3: D, child: H): H;
export function createContainer(d1: D, d2: D, d3: D, d4: D, child: H): H;
export function createContainer(d1: D, d2: D, d3: D, d4: D,  d5: D, child: H): H;
export function createContainer(d1: D, d2: D, d3: D, d4: D,  d5: D, d6: D, child: H): H;
export function createContainer(d1: D, d2: D, d3: D, d4: D,  d5: D, d6: D, d7: D, child: H): H;
export function createContainer(...args: (D | H)[]) {
  const directives = args.slice(0, args.length - 1) as D[];
  const target = args[args.length - 1] as H;

  directives.forEach(d => {
    d(target);
  });

  return target;
}