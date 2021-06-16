export type TransformerSchema = {[key: string]: [unknown, unknown]}
export type TransformedPayload<G extends TransformerSchema> = Record<string, G[string][1] | {[key in keyof G]: G[key][1]}>

export class Transformer<G extends TransformerSchema> {
  constructor(private scheme: {[key in keyof G]: (value: G[key][0]) => G[key][1] | boolean}) {}

  apply<T>(payload: T) {
    if (!payload) return undefined

    const payloadObj = payload as unknown as Record<string, G[string][0]>
    const payloadKeys = Object.keys(payloadObj)
    const transformedPayload = payloadKeys.reduce((obj, key) => {
      for (const transformerKey in this.scheme) {
        const res = this.scheme[transformerKey](payloadObj[key])
        if (res) {
          return { ...obj, [key]: { [transformerKey]: res } }
        }
      }
      return { ...obj, [key]: payloadObj[key] }
    }, {} as TransformedPayload<G>)

    return transformedPayload
  }

  diffs<K extends keyof G, T, D extends TransformedPayload<G>>(targetKey: K, payload: T, transformedPayload: D) {
    const payloadObj = payload as unknown as Record<string, G[string][0]>

    return Object.keys(transformedPayload).reduce((arr, key) => {
      const item = transformedPayload[key] as {[key in keyof G]: G[key][1]}
      if (typeof item === 'object' && targetKey in item) {
        return [...arr, { from: payloadObj[key], to: item[targetKey] }]
      }
      return arr
    }, [] as { from: G[K][0], to: G[K][1] }[])
  }
}
