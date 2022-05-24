import { Payload } from '.'
import { Mapping, ObjectMapping } from './utility-types'

export type TransformerSchema = {[key: string]: unknown[]}
export { ObjectMapping } from './utility-types'

type Diffs<Schema extends TransformerSchema, In extends number, Out extends number> = {
  [K in keyof Schema]: { from: Schema[K][In], to: Schema[K][Out] }
} extends Record<string, infer DD> ? DD : never

export class Transformer<Schema extends TransformerSchema, In extends number, Out extends number, Args> {
  constructor(private scheme: {[key in keyof Schema]: (value: Schema[keyof Schema][In], args: Args) => (Schema[key][Out] extends undefined ? Schema[key][0] : Schema[key][Out]) | boolean}) {}

  prop<T>(arg: T, args: Args): Mapping<T, Schema, In, Out> {
    for (const transformerKey in this.scheme) {
      const res = this.scheme[transformerKey](arg, args)
      if (res) return res as Mapping<T, Schema, In, Out>
    }
    return arg as Mapping<T, Schema, In, Out>
  }

  apply<T extends unknown | undefined>(payload: T, args: Args): ObjectMapping<T, Schema, In, Out> {
    if (typeof payload !== 'object') throw new Error('payload should be an object')
    const payloadObj = payload as Payload
    const payloadKeys = Object.keys(payloadObj)
    const transformedPayload = payloadKeys.reduce((obj, key) => {
      return { ...obj, [key]: this.prop(payloadObj[key], args) }
    }, {} as ObjectMapping<T, Schema, In, Out>)

    return transformedPayload
  }

  diffs<A extends Payload, B extends Payload>(from: A, to: B): Diffs<Schema, In, Out>[] {
    const keys = Object.keys(to)

    return keys
      .filter(key => from[key] !== to[key])
      .map(key => {
        return {
          from: from[key],
          to: to[key]
        } as Diffs<Schema, In, Out>
      })
  }
}
