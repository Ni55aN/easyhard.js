import { Services } from './types'
import { Hub } from './utils/communication'

const hub = new Hub<Services>(['easyhard-devtools','easyhard-content'])

hub.listen(payload => {
  console.log(payload.from, ' -> ', payload.to, ': ', payload.message.type, payload.message)
})

