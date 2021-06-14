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

export function parseCookies(cookieHeader: string): {[key: string]: string} {
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, ...rest] = cookie.split('=')
    return {
      ...acc,
      [key.trim()]: decodeURI(rest.join('='))
    }
  }, {})
}
