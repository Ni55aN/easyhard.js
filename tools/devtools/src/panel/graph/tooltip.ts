import cytoscape, { CollectionReturnValue, Core, SingularElementReturnValue } from 'cytoscape'
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

const popperStyle = document.createElement('style')

popperStyle.innerHTML = `
.tippy-box[data-theme~='observable'] {
  background-color: #f1c82a;
  color: black;
}
.tippy-box[data-theme~='observable'][data-placement^='top'] > .tippy-arrow::before {
  border-top-color: #f1c82a;
}
.tippy-box[data-theme~='observable'][data-placement^='bottom'] > .tippy-arrow::before {
  border-bottom-color: #f1c82a;
}
.tippy-box[data-theme~='observable'][data-placement^='left'] > .tippy-arrow::before {
  border-left-color: #f1c82a;
}
.tippy-box[data-theme~='observable'][data-placement^='right'] > .tippy-arrow::before {
  border-right-color: #f1c82a;
}
`
document.head.appendChild(popperStyle)

export function showObservableEmittedValue(cy: Core, id: string, value: object | string | number | boolean, props?: { duration?: number }) {
  const node = cy.getElementById(id) as (CollectionReturnValue & PopperNode)
  if (!node) throw new Error('cannot find node')

  const type = node.data('type')
  if (type !== 'observable') throw new Error('type isnt observable')

  const ref = node.popperRef()

  const tipp = tippy(document.createElement('div'), {
    getReferenceClientRect: ref.getBoundingClientRect,
    trigger: 'manual',
    placement: 'bottom',
    theme: 'observable'
  })

  tipp.setContent(String(value))
  tipp.show()

  setTimeout(() => {
    tipp.hide()
    tipp.destroy()
  }, props?.duration || 1000)
}
