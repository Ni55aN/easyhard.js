import { ObservableEmissionType } from '../types'

export function stringify<T extends object>(value: T): { value: string, type: ObservableEmissionType } {
  const type = typeof value

  if (value === null || value === undefined) {
    return {
      value: String(value),
      type: value === null ? 'null' : 'undefined'
    }
  }

  if (type === 'function') {
    return {
      value: value.constructor.name,
      type: 'function'
    }
  }

  const valueString = value && value.toString()

  if (['string', 'number', 'boolean'].includes(type)) {
    return {
      value: valueString,
      type: type as 'string' | 'number' | 'boolean'
    }
  }

  if (Array.isArray(value)) {
    return {
      value: `[${valueString}]`,
      type: 'array'
    }
  }

  if (type === 'object') {
    return {
      value: value.constructor.name,
      type: 'object'
    }
  }

  return {
    value: valueString,
    type: 'object'
  }
}
