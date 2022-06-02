import { Graph, Services } from './types'
import { Connection } from './utils/communication'
import { injectScript } from './utils/script'

const connection = new Connection<Services, 'easyhard-content'>('easyhard-content')

connection.addListener(message => {
  if (message.type === 'GET_GRAPH') {
    window.postMessage({ type: 'GET_GRAPH' })
  }
})

window.addEventListener('load', () => {
  window.postMessage({ type: 'GET_GRAPH' })
})

window.addEventListener('message', ({ data }: MessageEvent<{ type: 'GRAPH', data: Graph }>)  => {
  if(data.type === 'GRAPH') {
    connection.postMessage('easyhard-devtools', data)
  }
})

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
injectScript(chrome.runtime.getURL('/inject.js'), 'head')
