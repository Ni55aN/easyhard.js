/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUID } from 'easyhard-common'
import { Observable, OperatorFunction } from 'rxjs'

export function decorateOperator<Args extends never[], Return, Operator extends (...args: Args) => Return>(operator: Operator): Operator {
  return <Operator>((...args) => {
    const processedArgs = <Args>args.map((arg: any) => {
      if (typeof arg == 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return (...params: any[]) => {
          const result = arg(...params)
          if (result instanceof Observable) {
            (op as any).__debug.parent.push(result)
          }
          return result
        }
      }
      return arg
    })
    const op = operator(...processedArgs)

    if ((op as any).__debug) console.warn('__debug already defined')
    if (!(op as any).__debug) {
      (op as any).__debug = {
      id: getUID(),
        name: operator.name,
        parent: []
    }
    }
    (op as any).__debug.parent.push(...processedArgs.filter((a: any) => a instanceof Observable))

    return op
  })
}

export function decoratePipe(context: any, pipe: any) {
  return (...operations: OperatorFunction<any, any>[]): Observable<any> => {
    return pipe.apply(context, operations.map(op => {
      return (source: Observable<any>) => {
        const res = op(source)

        if (!(op as any).__debug) {
          console.warn('Skip operator without __debug property', op)
          return res
        }
        (res as any).__debug = {
          id: getUID(),
          name: (op as any).__debug.name,
          parent: [source, ...((op as any).__debug.parent ? (op as any).__debug.parent : [])]
        }
        return res
      }
    }))
  }
}

export function decorateObservableFactory<Ob extends (...args: (Observable<any> | never)[]) => Observable<any>>(factory: Ob): Ob {
  return <Ob>((...args) => {
    const ob = factory(...args)

    ;(ob as any).__debug = {
      id: getUID(),
      name: factory.name,
      parent: args.filter(o => o instanceof Observable || (typeof o === 'object' && 'nodeType' in o))
    }

    ob.pipe = decoratePipe(ob, ob.pipe)

    return ob
  })
}
