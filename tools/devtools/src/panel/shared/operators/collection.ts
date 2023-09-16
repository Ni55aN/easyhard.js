
import { $$Return, InsertReturn, RemoveReturn } from 'easyhard-common/structures/collection'
import { getCollectionItemId } from 'easyhard-common'
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

export function collectionRemove<T>(): OperatorFunction<$$Return<T>, T> {
  return pipe(
    filter<$$Return<T>, RemoveReturn<T>>((args): args is RemoveReturn<T> => Boolean(args && 'remove' in args)),
    map<RemoveReturn<T>, T>(value => {
      if ('remove' in value) {
        return value.item
      }
      throw new Error('insert property bot found')
    }),
  )
}

export function collectionSnaphot<T>(transform: (list: T[], item: T) => T): OperatorFunction<$$Return<T>, $$Return<T>> {
  const list: T[] = []

  return pipe(
    map(item => {
      if ('insert' in item) {
        const transformedItem = transform(list, item.item)

        list.push(transformedItem)
        return { ...item, item: transformedItem }
      }
      if ('remove' in item) {
        const id = getCollectionItemId(item)
        const i = typeof item === 'object' && 'id' in item ? list.findIndex(el => getCollectionItemId(el) === id) : list.indexOf(item.item)

        if ( i >= 0) {
          list.splice(i, 1)
        }
      }
      return item
    })
  )
}
