import { Attrs, TagName } from 'easyhard'
import { nanoid } from 'nanoid'
import { Observable } from 'rxjs'
import { Graph, GraphNode } from './types'

type Parent = (EhObservable | EhMeta | Parent)[]

// eslint-disable-next-line @typescript-eslint/ban-types
type EhObservable = Observable<unknown> & { __debug: { id: string, parent: Parent[], name: string } }
type EhMeta = { __easyhard?: { id: string, label?: string, attrs?: Attrs<TagName>, indirect?: boolean, type?: 'fragment', parent?: (EhMeta | EhObservable)[] }}
type EhNode = Node & EhMeta


function initParentObservableNodes(graph: Graph, ob: EhObservable | EhMeta) {
  if ('__easyhard' in ob) {
    // TODO
  } else if ('__debug' in ob) {
    if (!graph.nodes.find(n => n.id === ob.__debug.id)) {
      graph.nodes.push({
        id: ob.__debug.id,
        label: ob.__debug.name,
        type: 'observable'
      })

      ;(ob.__debug.parent.flat() as (EhObservable | EhMeta)[]).forEach(parent => {
        initParentObservableNodes(graph, parent)

        if (!ob.__debug.id) throw new Error('__debug id is undefined')

        if ('__debug' in parent) {
          graph.edges.push({
            id: [ob.__debug.id, parent.__debug.id].join('_'),
            source: parent.__debug.id,
            target: ob.__debug.id,
            type: 'pipe'
          })
        } else if ('__easyhard' in parent && parent.__easyhard) {
          graph.edges.push({
            id: [ob.__debug.id, parent.__easyhard.id].join('_'),
            source: parent.__easyhard.id,
            target: ob.__debug.id,
            type: 'pipe'
          })
        } else {
          throw new Error('not found __debug or __easyhard property')
        }
      })
    }
  } else {
    console.log(ob)
    throw new Error('ob doesnt have __debug or __easyhard')
  }
}

function pushObservableNodes(graph: Graph, ob: EhObservable, dependentNode: GraphNode) {
  initParentObservableNodes(graph, ob)

  if (!dependentNode.id) throw new Error('dependentNode id is undefined')

  graph.edges.push({
    id: [ob.__debug.id, dependentNode.id].join('_'),
    source: ob.__debug.id,
    target: dependentNode.id,
    type: 'pipe'
  })
}

function pushNode(ehNode: EhNode, graph: Graph): GraphNode | null {
  if (!ehNode.__easyhard && ehNode.nodeName == '#text' && !ehNode.textContent?.trim()) return null

  const node: GraphNode = {
    id: ehNode.__easyhard?.id || nanoid(),
    type: ehNode.__easyhard
      ? (ehNode.__easyhard.type || (ehNode.nodeName == '#text' ? 'eh-text' : 'eh-node'))
      : (ehNode.nodeName == '#text' ? 'text' : 'node'),
    label: ehNode.__easyhard && ehNode.__easyhard.label || (ehNode.nodeName == '#text' ? ehNode.textContent : ehNode.nodeName),
  }

  const attrs = ehNode.__easyhard?.attrs
  if (attrs) {
    for (const name in attrs) {
      const attr = attrs[name as keyof Attrs<TagName>] as Attrs<TagName>

      if (typeof attr === 'object' && 'subscribe' in attr) {
        const ob = attr as EhObservable

        pushObservableNodes(graph, ob, node)
      }
    }
  }
  const parent = ehNode.__easyhard?.parent

  if (parent) {
    parent.flat().forEach(item => {
      if ('subscribe' in item) {
        pushObservableNodes(graph, item, node)
      } else if (item.__easyhard) {
        graph.edges.push({
          source: item.__easyhard.id,
          target: node.id,
          id: [item.__easyhard.id, node.id].join('_'),
          type: 'bind'
        })
      }
    })
  }

  graph.nodes.push(node)

  ehNode.childNodes.forEach(item => {
    const childNode = pushNode(item, graph)

    if (!childNode) return
    if ((item as EhMeta).__easyhard?.indirect) return
    graph.edges.push({
      source: node.id,
      target: childNode.id,
      id: [node.id,childNode.id].join('_'),
      type: 'other'
    })
  })

  return node
}

window.addEventListener('message', ({ data }) => {
  console.log({ data })
  if (data.type === 'GET_GRAPH') {
    setTimeout(() => {
      const graph: Graph = { edges: [], nodes: [] }

      pushNode(document.body, graph)

      window.postMessage({ type: 'GRAPH', data: graph })
    }, 1000)
  }
})
