
console.log('test')

window.addEventListener('message', console.log)

window.postMessage({ test: 345 })
