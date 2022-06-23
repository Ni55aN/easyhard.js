import { Attrs, TagName } from 'easyhard'
import { nanoid } from 'nanoid'
import { Observable, ReplaySubject, Subscription } from 'rxjs'
import { EdgeType, Graph, GraphNode, Services } from './types'

type Parent = { type: EdgeType, link: EhObservable | EhMeta }
type NestedParent = Parent | NestedParent[]

// eslint-disable-next-line @typescript-eslint/ban-types
type EhObservable = Observable<unknown> & { __debug: { id: string, parent: NestedParent[], name: string, nextBuffer: ReplaySubject<{ value: any, time: number }> } }
type EhMeta = { __easyhard?: { id: string, label?: string, attrs?: Attrs<TagName>, indirect?: boolean, type?: 'fragment', static?: boolean, parent?: NestedParent[] }}
type EhNode = Node & EhMeta

function initParentObservableNodes(graph: Graph, ob: EhObservable | EhMeta, onAdd: (arg: EhNode | EhObservable) => void) {
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
      onAdd(ob)

      const flatParent = ob.__debug.parent.flat() as Parent[]

      flatParent.forEach(parent => {
        initParentObservableNodes(graph, parent.link, onAdd)

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

function pushObservableNodes(graph: Graph, ob: EhObservable, onAdd: (arg: EhNode | EhObservable) => void, edge: { type: EdgeType, label?: string }, dependentNode: GraphNode) {
  initParentObservableNodes(graph, ob, onAdd)

  if (!dependentNode.id) throw new Error('dependentNode id is undefined')

  graph.edges.push({
    id: [ob.__debug.id, dependentNode.id].join('_'),
    source: ob.__debug.id,
    target: dependentNode.id,
    type: edge.type,
    label: edge.label
  })
}

function pushNode(ehNode: EhNode, graph: Graph, onAdd: (arg: EhNode | EhObservable) => void): GraphNode | null {
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

        pushObservableNodes(graph, ob, onAdd, { type: 'argument', label: name }, node)
      }
    }
  }
  const parent = ehNode.__easyhard?.parent

  if (parent) {
    (parent.flat() as Parent[]).forEach(item => {
      if ('subscribe' in item.link) {
        pushObservableNodes(graph, item.link, onAdd, { type: item.type }, node)
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
    const childNode = pushNode(item, graph, onAdd)

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

function emissionTracker(onNext: (arg: { id: string, time: number,  value: any}) => void) {
  const observables: EhObservable[] = []
  const subscriptions = new Map<string, Subscription>()

  return {
    add(ob: EhObservable) {
      observables.push(ob)
    },
    remove(id: string) {
      subscriptions.get(id)?.unsubscribe()
    },
    flush() {
      while (observables.length) {
        const ob = observables.shift()
        if (!ob) return
        const id = ob.__debug.id
        const sub = ob.__debug.nextBuffer.subscribe(arg => onNext({ id, ...arg }))

        subscriptions.set(id, sub)
      }
    }
  }
}

const emissions = emissionTracker(data => send({ type: 'NEXT', data }))

window.addEventListener('message', ({ data }) => {
  if (data.type === 'GET_GRAPH') {
    const graph: Graph = { edges: [], nodes: [] }

    pushNode(document.body, graph, arg => '__debug' in arg && emissions.add(arg))

    send({ type: 'GRAPH', data: graph })
    emissions.flush()
  }
})

function traverseSubtree(node: Node): Node[] {
  return [node, ...Array.from(node.childNodes).map(traverseSubtree)].flat()
}

const m = new MutationObserver(mutationsList => {
  mutationsList.reverse().forEach(item => {
    if (item.type === 'childList') {
      const graph: Graph = { edges: [], nodes: [] }

      item.addedNodes.forEach(node => pushNode(node, graph, arg => '__debug' in arg && emissions.add(arg)))

      send({ type: 'ADDED', data: graph })

      const removedNodes = Array.from(item.removedNodes).map(traverseSubtree).flat()
      const removedNodesIds = removedNodes.map((removed: EhNode) => {
        return removed.__easyhard?.id
      }).filter((id): id is string => Boolean(id))

      if (removedNodesIds.length > 0) {
        send({ type: 'REMOVED', data: removedNodesIds })

        removedNodesIds.forEach(emissions.remove)
      }
    } else if (item.type === 'characterData') {
      const target: EhNode = item.target
      const meta = target.__easyhard

      if (!meta) throw new Error('should have __easyhard property')
      send({ type: 'TEXT', data: { id: meta.id, text: target.textContent || '' }})
    }
  })

  emissions.flush()
})

m.observe(document.body, {
  characterData: true,
  attributes: true,
  childList: true,
  subtree: true,
})
