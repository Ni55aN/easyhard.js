import { h, onMount } from 'easyhard'
import { css, injectStyles } from 'easyhard-styles'
import Split from 'split.js'

const globalStyles = document.createElement('style')

globalStyles.innerHTML = `
.gutter {
  background-color: #eee;

  background-repeat: no-repeat;
  background-position: 50%;
}

.gutter.gutter-horizontal {
  background-image: url('grips/vertical.png');
  cursor: col-resize;
}

.gutter.gutter-vertical {
  background-image: url('grips/horizontal.png');
  cursor: row-resize;
}
.gutter.gutter-vertical {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');
}

.gutter.gutter-horizontal {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
}
`
document.head.appendChild(globalStyles)

const styles = css({
  gridArea: 'b',
  display: 'flex',
  overflow: 'hidden'
})

export function Splitter(props: { sizes: number[] }, ...elements: HTMLElement[]) {
  onMount(elements[0], () => Split(elements, {
    direction: 'horizontal',
    minSize: [500, 200],
    ...props
  }))

  return h('div', {}, injectStyles(styles), ...elements)
}
