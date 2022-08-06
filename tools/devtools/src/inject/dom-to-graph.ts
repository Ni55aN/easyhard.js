// import { Attrs, TagName } from 'easyhard'
import { nanoid } from 'nanoid'
import { /*EdgeType, */EdgeType, Graph, GraphNode } from '../types'
import { findParent } from '../utils/dom'
import { EhMeta, EhNode, EhSubscriber, Parent } from '../dom-types'
import { Attrs, TagName } from 'easyhard'

export class DomToGraph {
  graph: Graph

  constructor(private events: { add: (arg: EhNode | EhSubscriber, props?: { type?: EdgeType, label?: string }) => void }) {
    this.graph = { edges: [], nodes: [] }
  }

  private isIgnored(ehNode: EhNode) {
    return ehNode.__easyhardIgnore || findParent(ehNode, node => Boolean(node && node.__easyhardIgnore))
  }

  private ensure(ehNode: EhNode): GraphNode | null{
    const id = ehNode.__easyhard?.id

    if (!id) return null

    const existing = this.graph.nodes.find(n => n.id === id)

    if (existing) {
      return existing
    }
    return this.add(ehNode)
  }

  public add(ehNode: EhNode): GraphNode | null {
    if (this.isIgnored(ehNode)) return null
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

        if (typeof attr === 'object' && 'unsubscribe' in attr) {
          this.events.add(attr, { type: 'argument', label: name })
        }
      }
    }
    const parent = ehNode.__easyhard?.parent

    if (parent) {
      (parent.flat() as Parent[]).forEach(item => {
        if ('__debug' in item.link) {
          this.events.add(item.link)
        } else if ('__easyhard' in item.link) {
          const linkNode = this.ensure(item.link)

          if (!linkNode) throw new Error('cannot create node')

          this.graph.edges.push({
            source: linkNode.id,
            target: node.id,
            id: [linkNode.id, node.id].join('_'),
            type: item.type
          })
        }
      })
    }

    this.graph.nodes.push(node)

    ehNode.childNodes.forEach(item => {
      const graphNode = this.add(item)

      if (!graphNode) return
      if ((item as EhMeta).__easyhard?.indirect) return
      this.graph.edges.push({
        source: node.id,
        target: graphNode.id,
        id: [node.id, graphNode.id].join('_'),
        type: 'other'
      })
    })

    return node
  }

  public isEmpty() {
    return this.graph.edges.length === 0 && this.graph.edges.length === 0
  }

  public serialize() {
    return this.graph
  }
}
