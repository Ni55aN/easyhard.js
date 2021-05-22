export function serializeError<T extends Record<string, unknown>>(_: string, value: T): T | Record<string, unknown> {
  if (value instanceof Error) {
    const error: Record<string, unknown> = { __ErrorInstance: true, name: value.name }

    Object.getOwnPropertyNames(value).forEach(key => {
      error[key] = value[key]
    })

    return error
  }
  return value
}
