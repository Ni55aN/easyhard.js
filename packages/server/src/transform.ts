/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Cookie } from 'easyhard-bridge'
import { TransformHandlerPayload } from './types'

export class Transformer<G extends {[key: string]: [unknown, unknown, unknown]}> {
  constructor(private transformers: {[key in keyof G]: (from: G[key][1]) => G[key][2] }) {}

  apply<T>(payload: T) {
    if (!payload) return payload as unknown as TransformHandlerPayload<T>

    const payloadObj = payload as Record<string, unknown>
    const transformedPayload = Object.keys(payload).reduce((obj, key) => {
      const item = payloadObj[key]

      for (const transformerKey in this.transformers) {
        if (item && typeof item === 'object' && transformerKey in item) {
          return { ...obj, [key]: this.transformers[transformerKey]((item as any)[transformerKey]) }
        }
      }
      return { ...obj, [key]: payloadObj[key] }
    }, {} as Record<string, unknown>)

    return transformedPayload as TransformHandlerPayload<T>
  }
}


export function serializeCookie<T extends Record<string, unknown>>(_: string, value: T): T | Record<string, unknown> {
  if (value instanceof Cookie) {
    return { __CookieInstance: true, key: value.key }

  }
  return value
}
