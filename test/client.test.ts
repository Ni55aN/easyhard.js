import { defer, firstValueFrom, interval } from 'rxjs'
import { Server, default as WebSocket, AddressInfo } from 'ws'
import { registerObservable, bindObservable, ConnectionState, ServerToClient, ClientToServer, Key } from '../packages/bridge/src/binder'
import { connectionSerializer } from '../packages/bridge/src/serializer'
import { Connection, createConnection } from '../packages/client/src/connection'
import { retry, retryWhen, take, tap } from 'rxjs/operators'

const serializer = connectionSerializer<ServerToClient<unknown>, ClientToServer<Key>, string, string>({ input: JSON.parse, output: JSON.stringify })

describe('client', () => {
  let server: Server
  let client: Connection<Record<string, unknown>>

  beforeEach(() => {
    const _server = server = new Server({ port: 0 })
    const port = (_server.address() as AddressInfo).port
    client = createConnection({ reconnectDelay: 100 })

    client.connect(() => new WebSocket(`ws://localhost:${port}`), {})
  })

  afterEach(() => {
    client.readyState === WebSocket.OPEN && client.close()
    server?.close()
  })

  it ('state', (done) => {
    server.addListener('connection', connection => {
      setTimeout(() => connection.terminate(), 1100)
    })
    setTimeout(async () => {
      const state = await firstValueFrom(client.state)
      expect(state).toBe(ConnectionState.OPEN)
    }, 1000)
    setTimeout(async () => {
      const state = await firstValueFrom(client.state)
      expect(state).toBe(ConnectionState.CLOSED)
      done()
    }, 1150)
  })

  it ('reconnects on terminate', (done) => {
    const result: (Error | number)[] = []
    const errors: Error[] = []
    server.addListener('connection', connection => {
      registerObservable<void, number>('getFromServer', defer(() => interval(100).pipe(
        take(5),
        tap(value => {
          if (value === 2) {
            connection.terminate()
          }
        })
      )), serializer.apply(connection))
    })
    const sub = bindObservable<number>('getFromServer', null, client).pipe(
      retryWhen(error => error.pipe(
        tap((error: Error) => {
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
      registerObservable<void, number>('getFromServer', defer(() => interval(100).pipe(
        tap(value => value === 3 && connection.terminate())
      )), serializer.apply(connection))
    })
    const sub1 = bindObservable<number>('getFromServer', null, client).pipe(
      tap({
        error: () => result.push(-1)
      }),
      retry()
    ).subscribe(value => result.push(value))
    const sub2 = bindObservable<number>('getFromServer', null, client).pipe(
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
