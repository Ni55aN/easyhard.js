export function getUID(): string {
  return (Date.now()+Math.random()).toString(36).replace('.', '')
}

export { $ } from './structures/value'
export { $$, $$Return, getCollectionItemId } from './structures/collection'
export * from './operators/index'
