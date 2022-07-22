/* eslint-disable @typescript-eslint/no-unused-vars */
import { $ } from 'easyhard-common'
import { h } from 'easyhard'
import { easyhardRequester, Requester ,} from 'easyhard-post-message'
import { delay, map, retry, Observable, OperatorFunction } from 'rxjs'

type M = {
  getData: Observable<number>,
  setData: OperatorFunction<number, void>
}

// ---------

const worker = new Worker(new URL('./post-message-worker.ts', import.meta.url))
// worker.onerror = console.log
// worker.onmessageerror = console.log
// test(easyhardRequester<M>(worker))

// worker.dispatchEvent(new Event('open'))
// setTimeout(() => {
//   worker.dispatchEvent(new CloseEvent('close', { code: 6 }))
//   worker.terminate()
// }, 5000)
// ----------

// const w = window.open('./post-message-worker.html', 'popup', 'width=200,height=200')

// if (!w) throw new Error('window not found')

// test(easyhardRequester<M>(w))

// -------

const frame = document.createElement('iframe')

frame.setAttribute('src', './post-message-worker.html')

document.body.append(frame)

// frame.addEventListener('load', () => {
const w = frame.contentWindow
if (!w) throw new Error('window not found')

test(easyhardRequester<M>(w))

// -------

function test(requester: Requester<M>) {
  // requester.call('getData').pipe(retry()).subscribe(console.log)
  requester.call('getData').subscribe(v => console.log(v), error => console.log('error', error))
  // const op = requester.pipe('setData')

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  // $(25).pipe(op, delay(2000), map(() => 64), op).subscribe()
  // document.body.appendChild(h('div', {}, requester.call('getData')))
}
