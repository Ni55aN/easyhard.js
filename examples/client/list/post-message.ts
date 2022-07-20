import { $ } from 'easyhard-common'
import { easyhardRequester, Requester ,} from 'easyhard-post-message'
import { delay, map, Observable, OperatorFunction } from 'rxjs'

type M = {
  getData: Observable<number>,
  setData: OperatorFunction<number, void>
}

// ---------

// const worker = new Worker(new URL('./post-message-worker.ts', import.meta.url))

// test(easyhardRequester<M>(worker))

// ----------

// const w = window.open('./post-message-worker.html')

// if (w) {
//   setTimeout(() => {
//     test(easyhardRequester<M>(w))
//   }, 1000)
// }


//////////

const frame = document.createElement('iframe')

frame.setAttribute('src', './post-message-worker.html')

document.body.append(frame)

frame.addEventListener('load', () => {
  if (!frame.contentWindow) throw new Error('window not found')

  test(easyhardRequester<M>(frame.contentWindow))
})


function test(requester: Requester<M>) {
  requester.call('getData').subscribe(console.log)
  const op = requester.pipe('setData')

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  $(25).pipe(op, delay(2000), map(() => 64), op).subscribe()
}
