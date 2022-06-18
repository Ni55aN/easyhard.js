import { Attrs, TagName } from 'easyhard'
import { nanoid } from 'nanoid'
import { Observable } from 'rxjs'
import { EdgeType, Graph, GraphNode, Services } from './types'

type Parent = { type: EdgeType, link: EhObservable | EhMeta }
type NestedParent = Parent | NestedParent[]

// eslint-disable-next-line @typescript-eslint/ban-types
type EhObservable = Observable<unknown> & { __debug: { id: string, parent: NestedParent[], name: string, onNext: ((value: any) => void)[] } }
type EhMeta = { __easyhard?: { id: string, label?: string, attrs?: Attrs<TagName>, indirect?: boolean, type?: 'fragment', static?: boolean, parent?: NestedParent[] }}
type EhNode = Node & EhMeta

const onNextListeners = new WeakMap<object, (value: any) => void>()

function initParentObservableNodes(graph: Graph, ob: EhObservable | EhMeta) {
  if ('__easyhard' in ob) {
    // TODO
  } else if ('__debug' in ob) {
    const id = ob.__debug.id
    if (!graph.nodes.find(n => n.id === id)) {
      graph.nodes.push({
        id,
        label: ob.__debug.name,
        type: 'observable'
      })

      if (!onNextListeners.has(ob.__debug)) {
        const callback = (value: any) => {
          send({ type: 'NEXT', data: { id, value }})
        }
        ob.__debug.onNext.push(callback)
        onNextListeners.set(ob.__debug, callback)
      }

      const flatParent = ob.__debug.parent.flat() as Parent[]

      flatParent.forEach(parent => {
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

  const meta = ehNode.__easyhard || (ehNode.__easyhard = { id: nanoid(), static: true })

  const node: GraphNode = {
    id: meta.id,
    type: meta.static
      ? (ehNode.nodeName == '#text' ? 'text' : 'node')
      : (meta.type || (ehNode.nodeName == '#text' ? 'eh-text' : 'eh-node')),
    label: meta?.label || (ehNode.nodeName == '#text' ? ehNode.textContent : ehNode.nodeName),
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

function send(message: Services['easyhard-devtools']) {
  window.postMessage(message)
}

window.addEventListener('message', ({ data }) => {
  // console.log({ data })
  if (data.type === 'GET_GRAPH') {
    setTimeout(() => {
      const graph: Graph = { edges: [], nodes: [] }

      pushNode(document.body, graph)

      send({ type: 'GRAPH', data: graph })
    }, 1000)
  }
})

function traverseSubtree(node: Node): Node[] {
  return [node, ...Array.from(node.childNodes).map(traverseSubtree)].flat()
}

const m = new MutationObserver(mutationsList => {
  mutationsList.reverse().forEach(item => {
    if (item.type === 'childList') {
      const graph: Graph = { edges: [], nodes: [] }

      item.addedNodes.forEach(node => pushNode(node, graph))

      send({ type: 'ADDED', data: graph })

      const removedNodes = Array.from(item.removedNodes).map(traverseSubtree).flat()
      const removedNodesIds = removedNodes.map((removed: EhNode) => {
        return removed.__easyhard?.id
      }).filter((id): id is string => Boolean(id))

      if (removedNodesIds.length > 0) {
        send({ type: 'REMOVED', data: removedNodesIds })
      }
    } else if (item.type === 'characterData') {
      const target: EhNode = item.target
      const meta = target.__easyhard

      if (!meta) throw new Error('should have __easyhard property')
      send({ type: 'TEXT', data: { id: meta.id, text: target.textContent || '' }})
    }
  })
})

m.observe(document.body, {
  characterData: true,
  attributes: true,
  childList: true,
  subtree: true,
})
