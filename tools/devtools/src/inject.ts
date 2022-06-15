import { Attrs, TagName } from 'easyhard'
import { nanoid } from 'nanoid'
import { Observable } from 'rxjs'
import { EdgeType, Graph, GraphNode } from './types'

type Parent = { type: EdgeType, link: EhObservable | EhMeta }
type NestedParent = Parent | NestedParent[]

// eslint-disable-next-line @typescript-eslint/ban-types
type EhObservable = Observable<unknown> & { __debug: { id: string, parent: NestedParent[], name: string } }
type EhMeta = { __easyhard?: { id: string, label?: string, attrs?: Attrs<TagName>, indirect?: boolean, type?: 'fragment', parent?: NestedParent[] }}
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

      ;(ob.__debug.parent.flat() as Parent[]).forEach(parent => {
        initParentObservableNodes(graph, parent.link)

        if (!ob.__debug.id) throw new Error('__debug id is undefined')

        if ('__debug' in parent.link) {
          graph.edges.push({
            id: [ob.__debug.id, parent.link.__debug.id].join('_'),
            source: parent.link.__debug.id,
            target: ob.__debug.id,
            type: parent.type
          })
        } else if ('__easyhard' in parent.link && parent.link.__easyhard) {
          graph.edges.push({
            id: [ob.__debug.id, parent.link.__easyhard.id].join('_'),
            source: parent.link.__easyhard.id,
            target: ob.__debug.id,
            type: parent.type
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

function pushObservableNodes(graph: Graph, ob: EhObservable, edge: { type: EdgeType, label?: string }, dependentNode: GraphNode) {
  initParentObservableNodes(graph, ob)

  if (!dependentNode.id) throw new Error('dependentNode id is undefined')

  graph.edges.push({
    id: [ob.__debug.id, dependentNode.id].join('_'),
    source: ob.__debug.id,
    target: dependentNode.id,
    type: edge.type,
    label: edge.label
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

        pushObservableNodes(graph, ob, { type: 'argument', label: name }, node)
      }
    }
  }
  const parent = ehNode.__easyhard?.parent

  if (parent) {
    (parent.flat() as Parent[]).forEach(item => {
      if ('subscribe' in item.link) {
        pushObservableNodes(graph, item.link, { type: item.type }, node)
      } else if (item.link.__easyhard) {
        graph.edges.push({
          source: item.link.__easyhard.id,
          target: node.id,
          id: [item.link.__easyhard.id, node.id].join('_'),
          type: item.type
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
