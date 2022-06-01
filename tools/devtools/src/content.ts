import { Services } from './types'
import { Connection } from './utils/communication'

const connection = new Connection<Services, 'easyhard-content'>('easyhard-content')

connection.addListener(message => {
  console.log('content received from background', { message })
})

document.body.addEventListener('click', () => {
  console.log('post')
  connection.postMessage('easyhard-devtools', { data: 'from content' })
})
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
injectScript(chrome.runtime.getURL('/inject.js'), 'head')
