import { untilExist } from 'easyhard'
import { map, Observable } from 'rxjs'
import { nodeSize, nodeMargin } from './consts'

export function Connection(line: Observable<{ start: { x: number, y: number }, end: { x: number, y: number } }>) {
  const svg1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  svg1.style.position = 'absolute'
  svg1.style.top = '0'
  svg1.style.left = String(nodeSize + nodeMargin)
  svg1.style.zIndex = '-1'
  svg1.setAttribute('width', '100%')
  svg1.setAttribute('height', '100%')

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('stroke-width', '3')
  path.setAttribute('stroke-dasharray', '8 4')
  path.setAttribute('stroke', 'grey')
  path.setAttribute('fill', 'none')
  // attach it to the container
  svg1.appendChild(path)

  line.pipe(untilExist(svg1), map(({ start, end }) => {
    const distance = Math.abs(start.y - end.y) / 2

    path.setAttribute('d', `M ${start.x},${start.y} Q ${(start.x + end.x) / 2 + distance},${(start.y + end.y) / 2} ${end.x},${end.y}`)
  })).subscribe()

  return svg1 as any as HTMLElement
}
