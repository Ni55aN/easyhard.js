import cytoscape from 'cytoscape'
import { AreaHighligher } from './highligher'

const delay = 500
const padding = 10
let timeout: NodeJS.Timeout

export function focusNode(cy: cytoscape.Core, id: string, highlighter: AreaHighligher) {
  const element = cy.getElementById(id)

  const { x, y } = element.position()
  const width = element.width() + padding * 2
  const height = element.height() + padding * 2

  if (timeout) clearTimeout(timeout)

  timeout = setTimeout(() => {
    highlighter.highlight({ x, y, width, height })
  }, delay)

  cy.animate({
    fit: {
      eles: element,
      padding: Math.min(cy.height(), cy.width()) * 0.42
    },
    duration: delay
  })
}
