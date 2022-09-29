type Func1 = (...args: any[]) => number
type Func2 = (...args: any[]) => string | boolean | number

type List = {
  "a": string
  "b": boolean
}
type Keys = 'a' | 'b'

type Func3 = <K extends Keys = Keys>(a: K, b: K) => List[K]
type Func4 = <K extends Keys = Keys>(a: K, b: K) => List[Keys]
