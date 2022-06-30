import 'luna-dom-highlighter/luna-dom-highlighter.css'
import LunaDomHighlighter from 'luna-dom-highlighter'
import { EhMeta } from './types'

export function createHighlighter() {
  const highligherContainer = document.createElement('div') as EhMeta & HTMLDivElement

  highligherContainer.__easyhardIgnore = true
  document.body.appendChild(highligherContainer)

  return new LunaDomHighlighter(highligherContainer, {
    showAccessibilityInfo: false,
    showStyles: false
  })
}
