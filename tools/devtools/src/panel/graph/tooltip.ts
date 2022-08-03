import cytoscape, { CollectionReturnValue, Core, NodeCollection, SingularElementReturnValue } from 'cytoscape'
import tippy, { Instance, sticky } from 'tippy.js'
import popper from 'cytoscape-popper'
import 'tippy.js/dist/tippy.css'

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
cytoscape.use(popper)

type PopperNode = { popperRef: () => any }

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


export function setupTooltips(cy: CollectionReturnValue) {
  cy.forEach(ele => {
    makePopperWithTippy(ele as (PopperNode & SingularElementReturnValue))
  })
}


const tippyEmissionStore = new WeakMap<NodeCollection, { tippy: Instance, timeout: NodeJS.Timeout }>()

const popperStyle = document.createElement('style')

popperStyle.innerHTML = `
.tippy-box[data-theme~='observable'] {
  background-color: #f1c82a;
  color: black;
  transform-origin: 50% -10px;
  transform: scale(var(--tooltip-scale, 1))
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


function renderJSON(object: object) {
  const data = JSON.stringify(object, null, 2)

  if (data.length > 25) return data.substring(0, 22) + '...'

  return data
}

export function showObservableEmittedValue(cy: Core, id: string, value: object | string | number | boolean, props?: { duration?: number }) {
  const node = cy.getElementById(id) as (CollectionReturnValue & PopperNode)
  if (!node.length) throw new Error('cannot find node')

  const type = node.data('type')
  if (type !== 'observable') throw new Error('type isnt observable')

  document.documentElement.style.setProperty('--tooltip-scale', String(Math.min(1, cy.zoom())))

  const ref = node.popperRef()
  const existTippy = tippyEmissionStore.get(node)

  const tippyInstance = existTippy?.tippy || tippy(document.createElement('div'), {
    getReferenceClientRect: ref.getBoundingClientRect,
    trigger: 'manual',
    placement: 'bottom',
    theme: 'observable',
    sticky: true,
    plugins: [sticky]
  })

  tippyInstance.setContent(typeof value === 'object' ? renderJSON(value) : String(value))
  tippyInstance.show()

  if (existTippy?.timeout) clearTimeout(existTippy.timeout)

  const timeout = setTimeout(() => {
    tippyInstance.hide()
  }, props?.duration || 1000)

  tippyEmissionStore.set(node, { tippy: tippyInstance, timeout })
}
