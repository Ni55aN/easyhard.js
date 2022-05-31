import { Services } from './types'
import { Connection } from './utils/communication'

console.log('test')

const connection = new Connection<Services>('easyhard-content')

connection.addListener(message => {
  console.log('content received from background', { message })
})

document.body.addEventListener('click', () => {
  console.log('post')
  connection.postMessage('easyhard-devtools', { data: 'from content' })
})
