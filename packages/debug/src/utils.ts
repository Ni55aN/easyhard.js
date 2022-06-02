import { getUID } from 'easyhard-common'
import { Observable, OperatorFunction } from 'rxjs'

export function decorateOperator<Args extends never[], Return, Operator extends (...args: Args) => Return>(operator: Operator): Operator {
  return <Operator>((...args) => {
    const op = operator(...args)

    ;(op as any).__debug = {
      id: getUID(),
      name: operator.name
    }

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
