import { h, onLife } from 'easyhard'
import cytoscape from 'cytoscape'
import { injectStyles } from 'easyhard-styles'
import { Observable, Subject, throwError } from 'rxjs'
import { debounceTime, delay, map, retry, pluck, tap, scan, catchError, distinctUntilChanged } from 'rxjs/operators'
import { nanoid } from 'nanoid'
import { createAreaHighlighter } from '../../../../panel/shared/cytoscape/highligher'
import { ObservableEmissionType } from '../../../../types'
import { collectionInsert, collectionRemove } from '../../../shared/operators/collection'
import { createContextMenu } from '../../../../panel/shared/cytoscape/context-menu'
import { useEffects } from '../../../../utils/effects'
import { focusNode } from '../../../shared/cytoscape/focus'
import { Table } from '../../table'
import { collapseOverlayNodes, expandOverlayNodes, timelineLayout } from './timeline-layout'
import { scaleGraph } from './scale-graph'
import { filterFullyVisibleNodes } from './utis'
import { theme } from './theme'

type Props = {
  table: Table
  focus: Observable<string>
  setValue: Observable<{ valueId: string, value: any, type: ObservableEmissionType }>
  toggle: Observable<{ id: string, hidden: boolean }>
  debug?: boolean
  tap?: (id: string, parentId?: string) => void
  log?: (valueId: string | string[]) => void
  fetchValue?: (id: string, valueId: string) => void
}

export function Graph(props: Props) {
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
            // 'content'(el: NodeSingular) {
            //   // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            //   return el.data('label') + '|' +  el.data('subscriberId') + '\n>' + el.data('sourceSubscriberIds')
            // },
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': theme['background'],
            'color'(el: cytoscape.NodeSingular) {
              return theme[el.data('type') as ObservableEmissionType]
            },
            'border-color': '#ddd',
            'border-width': '1',
            'font-size': '12',
            'width': 50,
            'height': 50,
            'text-max-width': '50',
            'text-wrap': 'wrap'// 'ellipsis'
          }
        },
        {
          selector: 'node:parent',
          css: {
            'text-valign': 'center',
            'shape': 'round-rectangle',
            'text-halign': 'left',
            'content': props.debug ? 'data(id)' : '',
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
    const areaHighligher = createAreaHighlighter(cy)
    const effects = useEffects()

    const now = Date.now()

    effects.add(props.table.asObservable().pipe(
      collectionInsert(),
      tap(item => {
        if (cy.hasElementWithId(item.id)) return
        cy.add({ group: 'nodes', data: { id: item.id }})
      }),
      map(({ id, data: item }) => {
        const currentId = item.valueId
        const currentTime = item.time
        const subscriberId = item.subscriberId
        const sourceSubscriberIds = item.sourceSubscriberIds

        cy.add({
          group: 'nodes',
          data: { id: currentId, subscriberId, sourceSubscriberIds, time: currentTime, parent: id, label: '...', emissionValueFetched: false },
          position: { x: (currentTime - now) / 100, y: 0 }
          // position: { x: (currentTime - now) / 100 * scale.getCoefficient(cy.zoom(), 1), y: 0 }
        })
        return { currentId, item }
      }),
      delay(100),
      tap(({ currentId, item }) => {
        const currentTime = item.time
        const sourceNodes = cy.nodes().filter((n: cytoscape.NodeSingular) => {
          return item.sourceSubscriberIds.includes(n.data('subscriberId') as string)
        })
        const lastNodes = sourceNodes
          .filter((source: cytoscape.NodeSingular) => source.outgoers().length === 0 && +source.data('time') <= currentTime)

        lastNodes.forEach(last => {
          cy.add({ group: 'edges', data: { id: nanoid(), source: last.data('id'), target: currentId }})
        })

        triggerLayout.next(null)
      })
    ))

    effects.add(props.table.asObservable().pipe(
      collectionRemove(),
      pluck('id'),
      map(cy.getElementById.bind(cy)),
      tap(node => node.remove())
    ))

    const triggerLayout = new Subject()
    let mouseIsOver = false
    effects.add(triggerLayout.pipe(
      debounceTime(200),
      tap(() => {
        timelineLayout(cy, { fit: !mouseIsOver, spacing: 5, field: 'time', scale: 0.05, start: now })
      })
    ))
    cy.on('mouseover', e => {
      if(e.target === cy) mouseIsOver = true
    })
    cy.on('mouseout', e => {
      if(e.target === cy) mouseIsOver = false
    })

    const activeParent = new Subject<cytoscape.NodeSingular | null>()

    effects.add(activeParent.pipe(
      distinctUntilChanged(),
      scan((prev, curr) => {
        if (curr === null) {
          if (prev) {
            prev.css('z-compound-depth', 'auto')
            prev.children().css('z-compound-depth', 'auto')
            collapseOverlayNodes(prev.children())
          }
          return null
        }
        curr.css('z-compound-depth', 'top')
        curr.children().css('z-compound-depth', 'top')
        expandOverlayNodes(curr.children())
        return curr
      }, null as cytoscape.NodeSingular | null)
    ))

    cy.on('mouseover', 'node', e => {
      const node: cytoscape.NodeSingular = e.target
      const parent = node.isParent() ? node : node.parent().first()

      activeParent.next(parent)
    })
    cy.on('mouseout', 'node', () => {
      activeParent.next(null)
    })

    effects.add(props.focus.pipe(
      map(timelineId => {
        return cy.getElementById(timelineId).children().last()
      }),
      tap(lastMarble => focusNode(cy, lastMarble.data('id') as string, areaHighligher)),
      catchError(err => {
        console.error(err)
        return throwError(() => err)
      }),
      retry()
    ))

    effects.add(props.toggle.pipe(
      tap(({ id, hidden }) => {
        const node = cy.getElementById(id)

        if (!node) return

        node.css('opacity', hidden ? '0.2' : '1')
      })
    ))

    effects.add(props.setValue.pipe(
      tap(args => {
        const node = cy.getElementById(args.valueId)

        if (!node || !node.isNode()) throw new Error('cannot fint node')

        node.data('label', args.value)
        node.data('type', args.type)
      })
    ))

    const scale = scaleGraph(cy, 'x')

    container.addEventListener('wheel', (e) => {
      const zoom = cy.zoom()
      const screenOffsetX = e.clientX - container.offsetLeft

      scale.apply(zoom, screenOffsetX)
    })

    cy.on('tap', 'node', e => {
      const node = e.target as cytoscape.NodeSingular
      const id: string = node.data('id')
      const parentId: string | undefined = node.parent()?.first().data('id')

      props.tap && props.tap(id, parentId)
    })

    cy.on('mousemove', () => {
      areaHighligher.hide()
    })

    createContextMenu(cy, 'node:child', [
      {
        content: h('span', {}, 'Log value'),
        select: el => {
          if (!props.log) return
          const id: string = el.data('id')

          props.log(id)
        }
      },
      {
        content: h('span', {}, 'Log nearest'),
        select: el => {
          if (!props.log) return
          const id: string = el.data('id')
          const child = cy.getElementById(id)
          const parent = child.parent()
          const nearest = parent.children().filter(node => Math.abs(node.position('x') - child.position('x')) < child.width())

          props.log(nearest.map(el => el.data('id') as string))
        }
      }
    ])

    cy.on('add pan zoom', () => {
      const { fetchValue } = props
      if (!fetchValue) return

      const nodesWithoutValue = cy.nodes(':child')
        .filter(node => !node.data('emissionValueFetched'))
      const visibleNodes = filterFullyVisibleNodes(cy, nodesWithoutValue, 0.9)

      visibleNodes.forEach(node => {
        const parent = node.parent().first()
        node.data('emissionValueFetched', true)

        fetchValue(String(parent.data('id')), String(node.data('id')))
      })
    })

    return () => {
      effects.dispose()
    }
  })


  return container
}
