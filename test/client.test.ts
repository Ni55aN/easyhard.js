import { interval } from 'rxjs'
import { Server, default as WebSocket, AddressInfo } from 'ws'
import { registerObservable, bindObservable } from '../packages/bridge/src/binder'
import { createConnection } from '../packages/client/src/connection'
import { retry, retryWhen, switchMap, take, tap } from 'rxjs/operators'

describe('client', () => {
  let server: Server
  let client: ReturnType<typeof createConnection>

  beforeEach(() => {
    server = new Server({ port: 0 })
    client = createConnection({ reconnectDelay: 100 })

    client.connect(() => new WebSocket(`http://localhost:${(server.address() as AddressInfo).port}`), {})
  })

  afterEach(() => {
    client.readyState === WebSocket.OPEN && client.close()
    server.close()
  })

  it ('reconnects on terminate', (done) => {
    const result: (Error | number)[] = []
    const errors: Error[] = []
    server.addListener('connection', connection => {
      registerObservable<void, number>('getFromServer', switchMap(() => interval(100).pipe(
        take(5),
        tap(value => {
          if (value === 2) {
            connection.terminate()
          }
        })
      )), connection)
    })
    const sub = bindObservable<Record<string, unknown>, number>('getFromServer', {}, client).pipe(
      retryWhen(error => error.pipe(
        tap(error => {
          errors.push(error)
          result.push(error)
        })
      ))
    ).subscribe({
      next: value => result.push(value)
    })
    setTimeout(() => expect(result).toMatchObject([0, 1]), 250)
    setTimeout(() => {
      expect(errors[0]).toBeInstanceOf(Error)
      expect(errors[0].message).toContain('WS closed')
      expect(result).toMatchObject([0, 1, errors[0]])
    }, 350)
    setTimeout(() => expect(result).toMatchObject([0, 1, errors[0], 0, 1]), 650)
    setTimeout(() => sub.unsubscribe(), 650)
    setTimeout(() => {
      expect(result).toMatchObject([0, 1, errors[0], 0, 1])
      done()
    }, 750)
  }, 8000)


  it ('reconnects on multiple subscriptions', (done) => {
    const result: number[] = []
    server.addListener('connection', connection => {
      registerObservable<void, number>('getFromServer', switchMap(() => interval(100).pipe(
        tap(value => value === 3 && connection.terminate())
      )), connection)
    })
    const sub1 = bindObservable<Record<string, unknown>, number>('getFromServer', {}, client).pipe(
      tap({
        error: () => result.push(-1)
      }),
      retry()
    ).subscribe(value => result.push(value))
    const sub2 = bindObservable<Record<string, unknown>, number>('getFromServer', {}, client).pipe(
      tap({
        error: () => result.push(-1)
      }),
      retry()
    ).subscribe(value => result.push(value))

    setTimeout(() => {
      sub1.unsubscribe()
      sub2.unsubscribe()
    }, 750)
    setTimeout(() => {
      expect(result).toMatchObject([0,0,1,1,2,2,-1,-1,0,0,1,1])
      done()
    }, 850)
  }, 8000)
})
