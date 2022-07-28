export const node = 'node[type="node"],node[type="eh-node"]'
export const text = 'node[type="text"],node[type="eh-text"]'
export const fragment = 'node[type="fragment"]'
export const observable = '[type="observable"],[type="observable-group"]'
export const elements = [node, fragment].join(',')
export const dom = [node, text, fragment].join(',')
