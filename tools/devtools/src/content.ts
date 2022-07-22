import { ConnectionTunnelKey, Services } from './types'
import { Connection } from './utils/communication'
import { injectScript } from './utils/script'
import { connectionTunnelEnter } from './utils/tunnel'

const connection = new Connection<Services>('easyhard-content', 'easyhard-devtools')

connectionTunnelEnter<ConnectionTunnelKey>('connectionTunnel', connection)

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
injectScript(chrome.runtime.getURL('/inject.js'), 'head')
