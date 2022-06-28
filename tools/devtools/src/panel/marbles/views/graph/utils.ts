
import { $$Return, InsertReturn } from 'easyhard-common/structures/collection'
import { OperatorFunction, pipe } from 'rxjs'
import { filter, map } from 'rxjs/operators'

export function collectionInsert<T>(): OperatorFunction<$$Return<T>, T> {
  return pipe(
    filter<$$Return<T>, InsertReturn<T>>((args): args is InsertReturn<T> => Boolean(args && 'insert' in args)),
    map<InsertReturn<T>, T>(value => {
      if ('insert' in value) {
        return value.item
      }
      throw new Error('insert property bot found')
    }),
  )
}
