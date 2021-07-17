import { interval } from 'rxjs'
import { Server, default as WebSocket, AddressInfo } from 'ws'
import { registerObservable, bindObservable } from '../packages/bridge/src/binder'
import { createConnection } from '../packages/client/src/connection'
import express from 'express'
import { retryWhen, switchMap, take, tap } from 'rxjs/operators'

describe('client', () => {
  let server: Server
  let client: ReturnType<typeof createConnection>
  let appServer: ReturnType<ReturnType<typeof express>['listen']>

  beforeEach((done) => {
    server = new Server({ port: 0 })
    client = createConnection({ reconnectDelay: 100 })

    client.connect(() => new WebSocket(`http://localhost:${(server.address() as AddressInfo).port}`), {})

    const app = express()
    appServer = app.listen(0, () => done())
  })

  afterEach(() => {
    appServer.close()
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
})
