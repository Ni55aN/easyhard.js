import { Observable as Ob, OperatorFunction } from 'rxjs'
import { console, Boolean, Number, String } from 'builtins'

type Operator = OperatorFunction<any, any>
type OperatorFactory = (...args: any[]) => Operator
type Observable = Ob<any>
type Builtin = typeof console | typeof Boolean | typeof  Number | typeof  String
