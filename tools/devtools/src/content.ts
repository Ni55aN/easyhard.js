import { Services } from './types'
import { Connection } from './utils/communication'
import { injectScript } from './utils/script'

const connection = new Connection<Services, 'easyhard-content'>('easyhard-content')

connection.addListener(message => {
  if (['GET_GRAPH', 'INSPECT'].includes(message.type)) {
    window.postMessage(message)
  }
})

window.addEventListener('load', () => {
  window.postMessage({ type: 'GET_GRAPH' })
})

window.addEventListener('message', ({ data }: MessageEvent<Services['easyhard-devtools']>)  => {
  if(['GRAPH', 'ADDED', 'REMOVED', 'TEXT', 'NEXT'].includes(data.type)) {
    connection.postMessage('easyhard-devtools', data)
  }
})

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
injectScript(chrome.runtime.getURL('/inject.js'), 'head')
