/* eslint-disable @typescript-eslint/no-unused-vars */
import { h } from 'easyhard'
import cytoscape from 'cytoscape'
import { Table } from '../../table'

export function Graph<T>(props: { table: Table<T> }) {
  const container = h('div', {})

  // const cy = cytoscape({
  //   container
  // })

  return container
}
