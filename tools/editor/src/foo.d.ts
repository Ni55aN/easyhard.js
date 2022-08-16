declare module 'rete-vue-render-plugin'
declare module 'rete-react-render-plugin'
declare module 'rete-area-plugin'
declare module 'rete-auto-arrange-plugin'
declare module 'rete-context-menu-plugin'

declare module 'cytoscape-dagre'
declare module 'cytoscape-klay'

declare module 'builtins' {
  export const console: Console
  // eslint-disable-next-line @typescript-eslint/ban-types
  export const Boolean: BooleanConstructor
  export const Number: NumberConstructor
  export const String: StringConstructor
  export const array: <T>(item: T) => Array<T>
}

declare module "*?raw" {
  const content: string;
  export default content;
}
