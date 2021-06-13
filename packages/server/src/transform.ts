/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { TransformHandlerPayload } from './types'

export function payloadTransformer<G extends {[key: string]: [unknown, unknown, unknown]}>(transformers: {[key in keyof G]: (from: G[key][1]) => G[key][2] }) {
  type Return<T> = TransformHandlerPayload<T>

  return function <T>(payload: T) {
    if (!payload) return payload as unknown as Return<T>

    const payloadObj = payload as Record<string, unknown>
    const transformedPayload = Object.keys(payload).reduce((obj, key) => {
      const item = payloadObj[key]

      for (const transformerKey in transformers) {
        if (item && typeof item === 'object' && transformerKey in item) {
          return { ...obj, [key]: transformers[transformerKey]((item as any)[transformerKey]) }
        }
      }
      return { ...obj, [key]: payloadObj[key] }
    }, {} as Record<string, unknown>)

    return transformedPayload as Return<T>
  }
}
