import { Services, ServicesTypes } from './types'
import { Connection } from './utils/communication'
import { injectScript } from './utils/script'

const connection = new Connection<Services, 'easyhard-content'>('easyhard-content')

connection.addListener(message => {
  const types: ServicesTypes<'easyhard-content'> = ['GET_GRAPH', 'INSPECT', 'INSPECTING', 'LOG_EMISSION', 'GET_EMISSION_VALUE']

  if (types.includes(message.type)) {
    window.postMessage(message)
  }
})

window.addEventListener('load', () => {
  window.postMessage({ type: 'GET_GRAPH' })
})

window.addEventListener('message', ({ data }: MessageEvent<Services['easyhard-devtools']>)  => {
  const types: ServicesTypes<'easyhard-devtools'> = ['GRAPH', 'ADDED', 'REMOVED', 'TEXT', 'NEXT', 'SUBSCRIBE', 'UNSUBSCRIBE', 'FOCUS', 'EMISSION_VALUE', 'STOP_INSPECTING']

  if (types.includes(data.type)) {
    connection.postMessage('easyhard-devtools', data)
  }
})

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
injectScript(chrome.runtime.getURL('/inject.js'), 'head')
