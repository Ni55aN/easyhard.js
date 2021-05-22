type ErrorIsh = { __ErrorInstance: true, name: string, message: string, stack?: string } & Record<string, unknown>

export function deserializeError<T extends ErrorIsh | Record<string, any> | unknown>(value: T): T | Error {
  if (typeof value !== 'object') return value
  const value2 = value as ErrorIsh | Record<string, any>

  if ('__ErrorInstance' in value2) {
    const error = new Error()

    Object.getOwnPropertyNames(value).forEach(key => {
      Object.defineProperty(error, key, { value: value2[key] })
    })
    return error
  }
  return value
}
