import { ObservableEmissionType } from '../../../../types'

export const theme: {[key in ObservableEmissionType | 'background']: string} = {
  'background': '#f7f7f7',
  'string': '#aa1111',
  'number': '#1a1aa6',
  'boolean': '#1a1aa6',
  'array': '#ab0d90',
  'function': '#ab0d90',
  'null': '#b6b6b6',
  'undefined': '#b6b6b6',
  'object': '#ab0d90'
}

