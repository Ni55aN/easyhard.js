import { console, String } from 'builtins'

function func1(props: { num: number, s: string }) {
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-call
  return String(props.num) + props.s
}

// eslint-disable-next-line functional/no-expression-statement
console.log(func1({ num: 1, s: 'abc' }))

