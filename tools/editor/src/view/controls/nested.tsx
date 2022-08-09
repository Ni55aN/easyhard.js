import * as React from 'react'
import _ from 'lodash'
import { Connection, Control, Node, NodeEditor } from 'rete'
import { useRef } from 'react';
import { NodeView } from 'rete/types/view/node';
import { getConnections } from '../utils'
import { Component, Scope } from '../components/base';

export type NestedNode = Node & { belongsTo?: Node | null }

export interface INestedNodeControl extends Control {
  adjustPlacement(): void
}

export class NestedNodeControl extends Control implements INestedNodeControl {
  render: string
  component: any
  props: { editor: NodeEditor, width: number, height: number, extender: number, onRef: (el: HTMLElement | null) => void }
  box: HTMLElement | null = null
  margin = 20
  scopeComponents: string[]
  rootComponents: string[]

  constructor(private editor: NodeEditor, private scope: Scope, key: string, private node: Node, components: {[key: string]: Component }) {
    super(key);
    this.render = "react";
    this.component = ({ onRef, height, width, extender }: typeof this.props) => {
      const inputEl = useRef(null);

      React.useEffect(() => onRef(inputEl.current), [inputEl])

      return <div ref={inputEl} style={{ background: 'white', height: `${height + extender}px`, width: `${width + extender}px` }}></div>
    }

    this.scopeComponents = Object.values(components).filter(c => c.scope === this.scope).map(c => c.name)
    this.rootComponents = Object.values(components).filter(c => c.scope === 'root').map(c => c.name)
    this.props = {
      editor,
      width: 140,
      height: 100,
      extender: 0,
      onRef: el => {
        this.box = el
      }
    };

    this.fixOrder()
    this.moveNestedNodes()
    this.updatingBelongTo()
    this.updateConnections()
    this.updateSizes()
  }

  fixOrder() {
    this.editor.on('rendernode', params => {
      if (params.node !== this.node) return
      params.el.style.zIndex = '-2'
    })
  }

  updateSizes() {
    const selectedNodes = new Set<Node>()
    let startPosition: [number, number] | null = null
    this.editor.on('nodeselect', (node: NestedNode) => {
      if (node === this.node) return
      selectedNodes.add(node)
      startPosition = [...this.node.position]
    })
    this.editor.on('nodetranslated', (args) => {
      if (args.node === this.node) return
      const view = this.editor.view.nodes.get(args.node)
      const el = view?.el
      if (!el || !this.box || !startPosition) return

      const k = 250
      const intersects = this.intersects(el, this.box)
      const inInner = this.scopeComponents.includes(args.node.name)
      const belongsToCurrentFunction = (args.node as NestedNode).belongsTo === this.node

      if (intersects && (!inInner || belongsToCurrentFunction)) {
        this.props.extender = k

        const view = this.editor.view.nodes.get(this.node)
        this.node.position = [startPosition[0] - k / 2, startPosition[1] - k / 2]
        view?.update()

          ; (this as any).update()

        this.editor.view.updateConnections({ node: this.node })
      }
    })
    this.editor.on('nodedragged', (node: NestedNode) => {
      if (node === this.node) return
      if (!startPosition) return

      // const view = this.editor.view.nodes.get(this.node)
      // this.node.position = startPosition
      // view?.update()
      this.adjustPlacement()

      this.props.extender = 0;
      startPosition = null
        ; (this as any).update()
      selectedNodes.delete(node)
      this.editor.view.updateConnections({ node: this.node })
    })
  }

  public adjustPlacement() {
    const nestedNodes = this.editor.nodes.filter(n => (n as NestedNode).belongsTo === this.node)

    const nestedNodesViews = nestedNodes
      .map(n => this.editor.view.nodes.get(n))
      .filter((n): n is NodeView => Boolean(n))
      .map(view => ({ rect: view.el.getBoundingClientRect(), view }))
    type Item = typeof nestedNodesViews[0]
    if (!nestedNodesViews.length) return

    const minLeft = _.minBy(nestedNodesViews, a => a.rect.left) as Item
    const minTop = _.minBy(nestedNodesViews, a => a.rect.top) as Item
    const maxRight = _.maxBy(nestedNodesViews, a => a.rect.right) as Item
    const maxBottom = _.maxBy(nestedNodesViews, a => a.rect.bottom) as Item

    this.props.width = (maxRight.rect.right - minLeft.rect.left) / this.editor.view.area.transform.k + this.margin * 2
    this.props.height = (maxBottom.rect.bottom - minTop.rect.top) / this.editor.view.area.transform.k + this.margin * 2

    const sideMargin = 20
    const topMargin = 80
    this.node.position = [minLeft.view.node.position[0] - sideMargin - this.margin, minTop.view.node.position[1] - topMargin - this.margin]
      ; (this as any).update()
    this.editor.view.nodes.get(this.node)?.update()
  }

  moveNestedNodes() {
    this.editor.on('nodetranslated', args => {
      if (args.node !== this.node) return
      const belongs = this.editor.nodes.filter(n => (n as NestedNode).belongsTo === args.node)

      belongs.forEach(n => {
        const dx = args.node.position[0] - args.prev[0]
        const dy = args.node.position[1] - args.prev[1]

        this.editor.view.nodes.get(n)?.translate(n.position[0] + dx, n.position[1] + dy)
      })
    })
  }

  updatingBelongTo() {
    const startPosition = new Map<Node, [number, number]>()
    this.editor.on('nodeselect', (node: NestedNode) => {
      startPosition.set(node, [...node.position])
    })
    this.editor.on('nodedragged', (node: NestedNode) => {
      const view = this.editor.view.nodes.get(node)
      const el = view?.el

      if (!el || !this.box) return
      const intersects = this.contains(el, this.box)
      const isFuncSpecific = this.scopeComponents.includes(node.name)
      const isRootSpecific = this.rootComponents.includes(node.name)

      if (intersects && !isRootSpecific && !(isFuncSpecific && node.belongsTo !== this.node)) {
        node.belongsTo = this.node
      } else if ((isFuncSpecific && node.belongsTo === this.node) || (isRootSpecific && intersects)) {

        const pos = startPosition.get(node)

        pos && view.translate(pos[0], pos[1])
      } else if (node.belongsTo === this.node) {
        node.belongsTo = null
      }

      startPosition.delete(node)
    })
  }

  getInputLoopNodes(current: Node, target: Node): Connection[] {
    const inputCons = getConnections(current, 'input')

    const directInputs = inputCons.filter(c => c['output'].node === target)
    if (directInputs.length) return directInputs

    return inputCons.map(c => {
      const n = c['output'].node

      return n && this.getInputLoopNodes(n, target).length ? c : null
    }).filter((c): c is Connection => Boolean(c))
  }

  updateConnections() {
    // listen after updatingBelongTo
    this.editor.on('nodedragged', (node: NestedNode) => {
      if (node.belongsTo === this.node) {
        this.getInputLoopNodes(node, node.belongsTo).forEach(c => {
          this.editor.removeConnection(c)
        })
        getConnections(node, 'output').forEach(c => {
          if ((c.input.node as NestedNode).belongsTo !== this.node) {
            this.editor.removeConnection(c)
          }
        })
      } else {
        getConnections(node, 'input').forEach(c => {
          if ((c.output.node as NestedNode).belongsTo === this.node) {
            this.editor.removeConnection(c)
          }
        })
      }
    })
    this.editor.on('connectioncreate', ({ input, output }) => {
      const outputBelongTo = (output.node as NestedNode).belongsTo
      const inputBelongTo = (input.node as NestedNode).belongsTo

      return !outputBelongTo || outputBelongTo === inputBelongTo
    })
  }

  contains(element: HTMLElement, box: HTMLElement) {
    const rect = element.getBoundingClientRect()
    const boxRect = box.getBoundingClientRect()

    return rect.top > boxRect.top
      && rect.left > boxRect.left
      && rect.bottom < boxRect.bottom
      && rect.right < boxRect.right
  }

  intersects(element: HTMLElement, box: HTMLElement) {
    const rect = element.getBoundingClientRect()
    const boxRect = box.getBoundingClientRect()

    return boxRect.left < rect.right &&
      boxRect.right > rect.left &&
      boxRect.top < rect.bottom &&
      boxRect.bottom > rect.top
  }

}
