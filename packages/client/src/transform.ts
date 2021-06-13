export function payloadTransformer<G extends {[key: string]: [unknown, unknown]}>(transformers: {[key in keyof G]: (value: G[key][0]) => G[key][1] | boolean}) {
  return function <T>(payload: T) {
    if (!payload) return { payload, getByKey() { return [] } }

    const payloadObj = payload as unknown as Record<string, G[string][0]>
    const payloadKeys = Object.keys(payloadObj)
    const transformedPayload = payloadKeys.reduce((obj, key) => {
      for (const transformerKey in transformers) {
        const res = transformers[transformerKey](payloadObj[key])
        if (res) {
          return { ...obj, [key]: { [transformerKey]: res } }
        }
      }
      return { ...obj, [key]: payloadObj[key] }
    }, {} as Record<string, G[string][1] | {[key in keyof G]: G[key][1]}>)

    return {
      payload: transformedPayload,
      getByKey<K extends keyof G>(targetKey: K) {
        return Object.keys(transformedPayload).reduce((arr, key) => {
          const item = transformedPayload[key] as {[key in keyof G]: G[key][1]}
          if (typeof item === 'object' && targetKey in item) {
            return [...arr, { from: payloadObj[key], to: item[targetKey] }]
          }
          return arr
        }, [] as { from: G[K][0], to: G[K][1] }[])
      }
    }
  }
}
