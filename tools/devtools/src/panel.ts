import cytoscape from 'cytoscape'
import { h } from 'easyhard'
import { css, injectStyles } from 'easyhard-styles'
import { tap } from 'rxjs'
import { Services } from './types'
import { Connection } from './utils/communication'

const connection = new Connection<Services>('easyhard-devtools')

connection.addListener(message => {
  console.log('panel received from background', { message })
})

const onClick = tap(() => {
  console.log('post')
  connection.postMessage('easyhard-content', { data: 'from panel' })
})


setTimeout(() => {
  const cy = cytoscape({
    container,
    elements: [ // list of graph elements to start with
      { // node a
        data: { id: 'a' }
      },
      { // node b
        data: { id: 'b' }
      },
      { // edge ab
        data: { id: 'ab', source: 'a', target: 'b' }
      }
    ],
    layout: {
      name: 'grid',
      rows: 1
    }
  })

  window.addEventListener('resize', () => {
    cy.resize()
  })

}, 200)



const bodyStyles = css({
  margin: 0,
  display: 'grid',
  gridTemplateRows: '3em 1fr',
  gridTemplateColumns: '1fr 12em',
  gridTemplateAreas: '"a a" "b c"',
  height: '100vh',
  width: '100vw'
})

document.body.classList.add(bodyStyles.className)

const panelStyles = css({
  background: 'grey',
  width: '100%',
  height: '100%',
  gridArea: 'a'
})
const panel =  h('div', { click: onClick } , injectStyles(panelStyles), 'Panel')
document.body.appendChild(panel)

const scontainerStyles = css({
  width: '100%',
  height: '100%',
  gridArea: 'b',
  overflow: 'hidden'
})
const container = h('div', {}, injectStyles(scontainerStyles))
document.body.appendChild(container)

const sidebarStyles = css({
  background: 'red',
  width: '100%',
  height: '100%',
  gridArea: 'c'
})
const sidebar =  h('div', {}, injectStyles(sidebarStyles), 'Sidebar')
document.body.appendChild(sidebar)
