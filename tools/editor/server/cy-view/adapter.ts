import { Core } from 'cytoscape'
import { Graph } from '../transpiler/types'

export function cytoscapeAdapter(cy: Core): Graph {
  function getUID(): string {
    return (Date.now()+Math.random()).toString(36).replace('.', '')
  }

  const findIdentifier: Graph['findIdentifier'] = async (name, prop, parent) => {
    const parentNode = parent ? cy.getElementById(parent) : null
    const found = (parentNode?.children() || cy.nodes().filter(n => n.isOrphan()))
      .filter(n => n.data(prop) && n.data(prop).includes(name))

    if (found.nonempty()) return { id: found.first().data('id') }
    if (parentNode) return findIdentifier(name, prop, parentNode.parent().first().id())
    return null
  }

  return {
    async addNode(data) {
      const id = getUID()

      cy.add({ group: 'nodes', data: { id, ...data }})

      return { id }
    },
    async addEdge(source, target, data) {
      const id = getUID()

      cy.add({ group: 'edges', data: { id, source, target, ...data }})

      return { id }
    },
    findIdentifier,
    async getData(id) {
      return cy.getElementById(id).data()
    },
    async patchData(id, data) {
      Object.keys(data).forEach(key => {
        cy.nodes().filter(n => n.data('id') === id).data(key, data[key])
      })
    }
  }
}
