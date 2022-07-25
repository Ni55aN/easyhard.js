import LunaDomHighlighter from 'luna-dom-highlighter'
import { BehaviorSubject, Subject } from 'rxjs'
import { EhNode } from './types'

export function createInspector(highlighter: LunaDomHighlighter) {
  const active = new BehaviorSubject(false)
  const over = new Subject<EhNode>()

  const mouseover = (e: MouseEvent) => {
    highlighter.hide()

    if (e.target && (e.target instanceof HTMLElement || e.target instanceof Text)) {
      highlighter.highlight(e.target)
      over.next(e.target)
    }
  }
  const mouseout = () => {
    highlighter.hide()
  }
  const click = () => {
    active.next(false)
  }

  return {
    active,
    over,
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
