import { h } from "./core";
import R from './structures/value';
import AR from './structures/array';
import { Observable, combineLatest } from "rxjs";
import { tap, map } from "rxjs/operators";
import { xIf } from './directives/if';
import { xFor } from './directives/for';

function Input(props: { value?: R<any>; model?: R<any>; type?: 'number' | 'text', change?: (v: string) => void }) {
  return h('input', {
    value: props.value || props.model,
    input: (v: Event) => {
      let val = (v.target as any).value;
      if (props.type === 'number') val = +val;
    
      if (props.model) props.model.next(val);
      if (props.change) props.change(val);
    }
  });
}

type Props = Parameters<typeof Input>[0];

function Label(props: { text: Observable<string> }) {
  return h('div', {}, props.text);
}

// function App(container: HTMLElement) {
//   const a = new R("hello");
//   const b = new R(1);
//   const b$ = b.asObservable().pipe(tap(v => console.log("update", v)));
//   const arr = new AR([new R(1), new R(2), new R(3)]);
//   setTimeout(() => arr.insert(new R(5), 0), 3000);
//   setTimeout(() => arr.removeAt(0), 6000);
//   setTimeout(() => arr.set(1, new R(77)), 9000);

//   const isHello = a.pipe(map(v => v === "hello"));

//   container.appendChild(
//     h('div', {},
//       h('div', {}, 
//         xIf(isHello, () => h('div', {}, b$)),
//         xFor(arr, v => h(Label, { text: combineLatest(a, v).pipe(map(([a, b]) => a + b)) })),
//         arr.get(0),
//         h('br', {}),
//         arr.get(1)
//       ),
//       h(Input, { value: a, change: (v: string) => a.next(v) })
//     )
//   );
// }

function App(container: HTMLElement) {
  const a = new R(0);
  const b = new R(0);
  const sum = combineLatest(a, b).pipe(map(([a, b]) => a + b));
  const moreThan10 = sum.pipe(map(v => v >= 2));
  const ar = new AR([new R(0), new R(1), new R(2)]);

  // sum.subscribe(num => {
  //   for (let i = ar.length - 1; i >= num; i--) {
  //     ar.removeAt(i);
  //   }
  //   for (let i = ar.length; i < num; i++) {
  //     ar.insert(new R(i), i)
  //   }
  // });

  setInterval(() => {
    const i = Math.floor(Math.random()*ar.length);
    const ob = ar.value[i];
    if(ob)
    ob.next(ob.value + 1);
  }, 100)

  container.appendChild(
    h('div', {},
      h(Input, { model: a, type: 'number' }),
      ' + ',
      h(Input, { model: b, type: 'number' }),
      ' = ',
      sum,
      h('b', {}, moreThan10.pipe(map(b => b ? 'more than 10' : null))),
      h('br', {}),
      xFor(ar, (i: Observable<number>) => xIf(moreThan10, () => h('div', {}, i))),
      h('hr', {}),
      // xIf(moreThan100, () => xFor(ar, (i: number) => h('b', {}, i)))
    )
  );
}

App(document.body);
