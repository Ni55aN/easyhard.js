export function scrollToRight(element: Element) {
  return element.scrollTo(element.scrollWidth, element.scrollTop)
}

export function zoomArea(element: HTMLElement, e: WheelEvent, props: { deadZone: { left: number }, intensity: number }) {
  const isNegative = e.deltaY < 0
  const delta = isNegative ? props.intensity : - props.intensity

  const cursorLocalOffset = e.pageX - element.offsetLeft - props.deadZone.left
  const innerWidth = element.scrollWidth
  const newInnerWidth = innerWidth * (1 + delta)

  const innerOffset = element.scrollLeft
  const p0 = (innerOffset + cursorLocalOffset) / innerWidth
  const newInnerOffset = innerOffset + (newInnerWidth - innerWidth) * p0

  return {
    newInnerOffset,
    delta
  }
}
