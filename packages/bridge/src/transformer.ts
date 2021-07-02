import { Payload } from '.'
import { Mapping, ObjectMapping } from './utility-types'

export type TransformerSchema = {[key: string]: unknown[]}
export { ObjectMapping } from './utility-types'

type Diffs<Schema extends TransformerSchema, In extends number, Out extends number> = {
  [K in keyof Schema]: { from: Schema[K][In], to: Schema[K][Out] }
} extends Record<string, infer DD> ? DD : never

export class Transformer<Schema extends TransformerSchema, In extends number, Out extends number> {
  constructor(private scheme: {[key in keyof Schema]: (value: Schema[keyof Schema][In]) => Schema[key][Out] | boolean}) {}

  prop<T>(arg: T): Mapping<T, Schema, In, Out> {
    for (const transformerKey in this.scheme) {
      const res = this.scheme[transformerKey](arg)
      if (res) return res as Mapping<T, Schema, In, Out>
    }
    return arg as Mapping<T, Schema, In, Out>
  }

  apply<T extends unknown | undefined>(payload: T, middleware?: (args: Diffs<Schema, In, Out>) => any): ObjectMapping<T, Schema, In, Out> | undefined {
    if (!payload) return
    if (typeof payload !== 'object') throw new Error('payload should be an object')
    const payloadObj = payload as Payload
    const payloadKeys = Object.keys(payloadObj)
    const transformedPayload = payloadKeys.reduce((obj, key) => {
      const value = payloadObj[key]
      const next = this.prop(value)

      return { ...obj, [key]: middleware ? middleware({ from: value, to: next } as Diffs<Schema, In, Out>) : next }
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
