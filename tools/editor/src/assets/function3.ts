
function func1(props: { num: number, s: string }) {
  return String(props.num) + props.s
}

// eslint-disable-next-line functional/no-expression-statement
func1({ num: 1, s: 'abc' })
