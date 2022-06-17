import cytoscape, { Core, SingularElementReturnValue } from 'cytoscape'
import tippy, { Instance } from 'tippy.js'
import popper from 'cytoscape-popper'
import 'tippy.js/dist/tippy.css'

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
cytoscape.use(popper)

type PopperNode = { popperRef: () => any, tippy: Instance<any> }

function makePopperWithTippy(node: PopperNode & SingularElementReturnValue) {
  if (!node.isNode()) return

  const ref = node.popperRef()

  const tipp = tippy(document.createElement('div'), {
    getReferenceClientRect: ref.getBoundingClientRect,
    trigger: 'manual'
  })

  node.on('mouseover', () => {
    const label = String(node.data('label'))

    if (label.length * parseFloat(node.style('font-size') as string) / 1.5 > node.width()) {
      tipp.setContent(label)
      tipp.show()
    }
  })
  node.on('mouseout', () => {
    tipp.hide()
  })
}


export function setupTooltips(cy: Core) {
  cy.elements().forEach(ele => {
    makePopperWithTippy(ele as (PopperNode & SingularElementReturnValue))
  })
}
