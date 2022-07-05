/* eslint-disable @typescript-eslint/no-unsafe-argument */
import cytoscape from 'cytoscape'
import cxtmenu from 'cytoscape-cxtmenu'

cytoscape.use(cxtmenu)

type Command = {
  content: HTMLElement
  select: (element: cytoscape.SingularData) => void
}
type Commands = Command[] | ((element: cytoscape.SingularData) => Command[])

export function createContextMenu(cy: cytoscape.Core, selector: string, commands: Commands) {
  cy.cxtmenu({
    selector,
    commands,
    menuRadius: 50
  })
}
