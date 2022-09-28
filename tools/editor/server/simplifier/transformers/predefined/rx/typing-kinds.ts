import { Observable as Ob, OperatorFunction } from 'rxjs'

type Operator = OperatorFunction<any, any>
type OperatorFactory = (...args: any[]) => Operator
type Observable = Ob<any>
type ObservableFactory = (...args: any[]) => Observable
