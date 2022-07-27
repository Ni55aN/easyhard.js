chrome.devtools.inspectedWindow.eval<boolean>('Boolean(window.__easyhardDebug)', (debugMode, exceptionInfo) => {
  if (exceptionInfo) {
    chrome.devtools.inspectedWindow.eval(`console.error('[Easyhard.js DevTools]', ${JSON.stringify(exceptionInfo.value)})`)
    return
  }
  if (debugMode) {
    chrome.devtools.panels.create('Easyhard.js', '', '/panel.html')
  }
})
