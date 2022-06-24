import { h, onLife } from 'easyhard'
import cytoscape from 'cytoscape'
import stringify from 'fast-safe-stringify'
import { Table, TableItem } from '../../table'
import { injectStyles } from 'easyhard-styles'
import { combineLatest, NEVER, of, Subject } from 'rxjs'
import { debounceTime, delay, filter, map, mergeMap, tap } from 'rxjs/operators'
import { nanoid } from 'nanoid'
import { timelineLayout } from './timeline-layout'
import { scaleGraph } from './scale-graph'
import { InsertReturn } from 'easyhard-common/structures/collection'

export function Graph<T>(props: { table: Table<T> }) {
  const container = h('div', {}, injectStyles({ height: '100%' }))

  onLife(container, () => {
    const cy = cytoscape({
      container,
      boxSelectionEnabled: false,
      minZoom: 0.3,
      maxZoom: 1.1,
      wheelSensitivity: 0.1,
      autoungrabify: true,
      style: [
        {
          selector: 'node[label]',
          css: {
            'content': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': 'grey',
            'color': 'white',
            'border-color': 'black',
            'border-width': '1',
            'font-size': '12',
            'width': 50,
            'height': 50,
            'text-max-width': '50',
            'text-wrap': 'ellipsis'
          }
        },
        {
          selector: 'node:parent',
          css: {
            'text-valign': 'center',
            'shape': 'round-rectangle',
            'text-halign': 'left',
            'content': 'data(id)',
            'color': 'grey'
          }
        },
        {
          selector: 'edge',
          css: {
            'curve-style': 'unbundled-bezier',
            'control-point-weights': [0, 0.3, 0.7, 1],
            'control-point-distances'(edge) {
              const k = Math.abs(edge.source().position('y') - edge.target().position('y'))

              return [-k * 0.1, -k * 0.15, -k * 0.15, -k * 0.1]
            },
            'target-arrow-shape': 'triangle',
            'line-style': 'dashed',
            'line-dash-pattern': [8, 4],
            'width': 2
          }
        }
      ],
      layout: {
        name: 'preset'
      }
    })

    const now = Date.now()
    const sub =  props.table.asObservable().pipe(
      mergeMap(value => {
        if ('insert' in value) {
          cy.add({ group: 'nodes', data: { id: value.item.id }})
          return combineLatest(of(value.item.id), value.item.data)
        }
        return NEVER
      }),
      filter((args): args is [string, InsertReturn<TableItem<T>>] => 'insert' in args[1]),
      map(([id, item]) => {
        const currentId = nanoid()

        const currentTime = item.item.time

        cy.add({
          group: 'nodes',
          data: { id: currentId, time: currentTime, parent: id, label: stringify(item.item.emission) },
          position: { x: (currentTime - now) / 100, y: 0 }
        })
        return { currentId, item }
      }),
      delay(100),
      tap(({ currentId, item }) => {
        if (!('insert' in item)) return

        const currentTime = item.item.time
        const parentNodes = cy.nodes().filter((n: cytoscape.NodeSingular) => {
          return item.item.parents.includes(n.data('id') as string)
        })
        const nestedNodes = parentNodes.map((parentNode: cytoscape.NodeSingular) => {
          return {
            parentNode,
            last: parentNode.children().filter((n: cytoscape.NodeSingular) => n.data('time') <= currentTime).last()
          }
        })

        nestedNodes.forEach(({ last }) => {
          cy.add({ group: 'edges', data: { id: nanoid(), source: last.data('id'), target: currentId }})
        })

        triggerLayout.next(null)
      })
    ).subscribe()

    const triggerLayout = new Subject()
    const layoutSub = triggerLayout.pipe(
      debounceTime(200),
      tap(() => {
        timelineLayout(cy, { fit: true, spacing: 5, field: 'time', scale: 0.05, start: now })
      })
    ).subscribe()


    const scale = scaleGraph(cy, 'x')

    container.addEventListener('wheel', (e) => {
      const zoom = cy.zoom()
      const screenOffsetX = e.clientX - container.offsetLeft

      scale.apply(zoom, screenOffsetX)
    })

    return () => {
      sub.unsubscribe()
      layoutSub.unsubscribe()
    }
  })


  return container
}
