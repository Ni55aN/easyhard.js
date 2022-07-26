import { h, onLife } from 'easyhard'
import cytoscape from 'cytoscape'
import { injectStyles } from 'easyhard-styles'
import { combineLatest, Observable, of, Subject, throwError } from 'rxjs'
import { debounceTime, delay, map, retry, mergeMap, pluck, tap, scan, catchError, distinctUntilChanged } from 'rxjs/operators'
import { nanoid } from 'nanoid'
import { createAreaHighlighter } from '../../../../panel/shared/cytoscape/highligher'
import { ObservableEmissionType } from '../../../../types'
import { collectionInsert, collectionRemove } from '../../../shared/operators/collection'
import { createContextMenu } from '../../../../panel/shared/cytoscape/context-menu'
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
            'text-wrap': 'ellipsis'
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

    const now = Date.now()
    const insertSub = props.table.asObservable().pipe(
      collectionInsert(),
      tap(item => cy.add({ group: 'nodes', data: { id: item.id }})),
      mergeMap(item => combineLatest(of(item.id), item.data.pipe(collectionInsert()))),
      map(([id, item]) => {
        const currentId = item.valueId
        const currentTime = item.time

        cy.add({
          group: 'nodes',
          data: { id: currentId, time: currentTime, parent: id, label: '...', emissionValueFetched: false },
          position: { x: (currentTime - now) / 100, y: 0 }
        })
        return { currentId, item }
      }),
      delay(100),
      tap(({ currentId, item }) => {
        const currentTime = item.time
        const parentNodes = cy.nodes().filter((n: cytoscape.NodeSingular) => {
          return item.parents.includes(n.data('id') as string)
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

    const removeSub = props.table.asObservable().pipe(
      collectionRemove(),
      pluck('id'),
      map(cy.getElementById.bind(cy)),
      tap(node => node.remove())
    ).subscribe()

    const triggerLayout = new Subject()
    let mouseIsOver = false
    const layoutSub = triggerLayout.pipe(
      debounceTime(200),
      tap(() => {
        timelineLayout(cy, { fit: !mouseIsOver, spacing: 5, field: 'time', scale: 0.05, start: now })
      })
    ).subscribe()
    cy.on('mouseover', e => {
      if(e.target === cy) mouseIsOver = true
    })
    cy.on('mouseout', e => {
      if(e.target === cy) mouseIsOver = false
      })

    const activeParent = new Subject<cytoscape.NodeSingular | null>()
    const activeSub = activeParent.pipe(
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
    ).subscribe()

    cy.on('mouseover', 'node', e => {
      const node: cytoscape.NodeSingular = e.target
      const parent = node.isParent() ? node : node.parent().first()

      activeParent.next(parent)
    })
    cy.on('mouseout', 'node', () => {
      activeParent.next(null)
    })

    const focusSub = props.focus.pipe(
      map(timelineId => {
        return cy.getElementById(timelineId).children().last()
      }),
      tap(lastMarble => focusNode(cy, lastMarble.data('id') as string, areaHighligher)),
      catchError(err => {
        console.error(err)
        return throwError(() => err)
      }),
      retry()
    ).subscribe()

    const toggleSub = props.toggle.pipe(
      tap(({ id, hidden }) => {
        const node = cy.getElementById(id)

        if (!node) return

        node.css('opacity', hidden ? '0.2' : '1')
      })
    ).subscribe()

    const setValueSub = props.setValue.pipe(
      tap(args => {
        const node = cy.getElementById(args.valueId)

        if (!node || !node.isNode()) throw new Error('cannot fint node')

        node.data('label', args.value)
        node.data('type', args.type)
      })
    ).subscribe()

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
      insertSub.unsubscribe()
      removeSub.unsubscribe()
      layoutSub.unsubscribe()
      activeSub.unsubscribe()
      focusSub.unsubscribe()
      toggleSub.unsubscribe()
      setValueSub.unsubscribe()
    }
  })


  return container
}
