
export function InspectIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  svg.setAttribute('width', '15')
  svg.setAttribute('height', '14')
  svg.setAttribute('viewBox', '0 0 22 22')

  svg.innerHTML = `
    <path d="M0 0h24v24H0z" fill="none">
    </path>
    <path fill="currentColor" d="
      M8.5,22H3.7l-1.4-1.5V3.8l1.3-1.5h17.2l1,1.5v4.9h-1.3V4.3l-0.4-0.6H4.2L3.6,4.3V20l0.7,0.7h4.2V22z
      M23,13.9l-4.6,3.6l4.6,4.6l-1.1,1.1l-4.7-4.4l-3.3,4.4l-3.2-12.3L23,13.9z
    ">
    </path>
  `

  return svg
}
