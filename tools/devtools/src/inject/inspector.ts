import LunaDomHighlighter from 'luna-dom-highlighter'
import { EhNode } from './types'

export function createInspector(highlighter: LunaDomHighlighter, onOver: (element: EhNode) => void, onClose: () => void) {
  const mouseover = (e: MouseEvent) => {
    highlighter.hide()

    if (e.target && (e.target instanceof HTMLElement || e.target instanceof Text)) {
      highlighter.highlight(e.target)
      onOver(e.target)
    }
  }
  const mouseout = () => {
    highlighter.hide()
  }
  const click = () => {
    onClose()
  }

  return {
    start() {
      document.body.addEventListener('mouseover', mouseover)
      document.body.addEventListener('mouseout', mouseout)
      document.body.addEventListener('click', click)
    },
    stop() {
      document.body.removeEventListener('mouseover', mouseover)
      document.body.removeEventListener('mouseout', mouseout)
      document.body.addEventListener('click', click)
      highlighter.hide()
    }
  }
}
