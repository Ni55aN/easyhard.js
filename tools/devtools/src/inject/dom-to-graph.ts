import { Attrs, TagName } from 'easyhard'
import { nanoid } from 'nanoid'
import { EdgeType, Graph, GraphNode } from '../types'
import { findParent } from '../utils/dom'
import { EhMeta, EhNode, EhObservable, Parent } from '../dom-types'

export class DomToGraph {
  graph: Graph

  constructor(private events: { add: (arg: EhNode | EhObservable) => void }) {
    this.graph = { edges: [], nodes: [] }
  }

  private initParentObservableNodes(ob: EhObservable | EhMeta) {
    if ('__easyhard' in ob) {
      // TODO
    } else if ('__debug' in ob) {
      const id = ob.__debug.id
      if (!this.graph.nodes.find(n => n.id === id)) {
        this.graph.nodes.push({
          id,
          label: ob.__debug.name,
          type: 'observable'
        })
        this.events.add(ob)

        const flatParent = ob.__debug.parent.flat() as Parent[]

        flatParent.forEach(parent => {
          this.initParentObservableNodes(parent.link)

          if (!ob.__debug.id) throw new Error('__debug id is undefined')

          if ('__debug' in parent.link) {
            this.graph.edges.push({
              id: [ob.__debug.id, parent.link.__debug.id].join('_'),
              source: parent.link.__debug.id,
              target: ob.__debug.id,
              type: parent.type
            })
          } else if ('__easyhard' in parent.link && parent.link.__easyhard) {
            this.graph.edges.push({
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

  private addObservable(ob: EhObservable, edge: { type: EdgeType, label?: string }, dependentNode: GraphNode) {
    this.initParentObservableNodes(ob)

    if (!dependentNode.id) throw new Error('dependentNode id is undefined')

    this.graph.edges.push({
      id: [ob.__debug.id, dependentNode.id].join('_'),
      source: ob.__debug.id,
      target: dependentNode.id,
      type: edge.type,
      label: edge.label
    })
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

        if (typeof attr === 'object' && 'subscribe' in attr) {
          const ob = attr as EhObservable

          this.addObservable(ob, { type: 'argument', label: name }, node)
        }
      }
    }
    const parent = ehNode.__easyhard?.parent

    if (parent) {
      (parent.flat() as Parent[]).forEach(item => {
        if ('subscribe' in item.link) {
          this.addObservable(item.link, { type: item.type }, node)
        } else if (item.link.__easyhard) {
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
