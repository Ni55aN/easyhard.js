import { defer, interval, NEVER, Subscriber } from 'rxjs'
import { IncomingMessage, ServerResponse } from 'http'
import { Server, default as WebSocket, AddressInfo } from 'ws'
import { Readable } from 'stream'
import { registerObservable, bindObservable } from '../packages/bridge/src/binder'
import express from 'express'
import fetch from 'node-fetch'
import { mapTo, take, tap } from 'rxjs/operators'
import { NOT_FOUND_STREAM_ERROR } from '../packages/bridge/src/constants'

async function sendFile(id: string | number | symbol, port: number, stream: Readable) {
  const res = await fetch(`http://localhost:${port}/api`, {
    method: 'post',
    headers: {
      'easyhard-observable-id': String(id)
    },
    body: stream
  })
  const buf = await res.buffer()

  return buf
}

describe('binder', () => {
  let server: Server
  let client: WebSocket
  let listeners: Map<string, Subscriber<any>>
  let appServer: ReturnType<ReturnType<typeof express>['listen']>
  const FILE_ID = 'file-id'

  beforeEach((done) => {
    server = new Server({ port: 0 })
    client = new WebSocket(`ws://localhost:${(server.address() as AddressInfo).port}`)

    const app = express()

    listeners = new Map<string, Subscriber<any>>()
    app.all('/api', (req: IncomingMessage, res: ServerResponse) => {
      const id = req.headers['easyhard-observable-id'] as string
      const listener = listeners.get(id)
      if (!listener) return

      req
        .on('data', data => listener.next(data))
        .on('error', (err) => {
          listener.error(err)
          res.writeHead(400)
          res.end('fail')
        })
        .on('end', () => {
          listener.complete()
          res.writeHead(200)
          res.end('ok')
        })
    })
    appServer = app.listen(0, () => done())
  })

  afterEach((done) => {
    appServer.close()
    client.readyState === WebSocket.OPEN && client.close()
    server.close()
    setTimeout(() => {
      done()
    }, 500)
  })

  it ('client subscribes to server', (done) => {
    server.addListener('connection', connection => {
      registerObservable<void, number>('getFromServer', defer(() => interval(100).pipe(take(5))), connection)
    })
    const results: number[] = []
    bindObservable<number>('getFromServer', null, client).subscribe({
      next: value => results.push(value),
      complete: () => results.push(999)
    })
    setTimeout(() => {
      expect(results).toEqual([0,1,2])
    }, 350)
    setTimeout(() => {
      expect(results).toEqual([0,1,2,3,4,999])
      done()
    }, 550)
  })

  it ('server subscribes to client', (done) => {
    const results: number[] = []
    server.addListener('connection', connection => {
      bindObservable<number>('getFromClient', null, connection).subscribe({
        next: value => results.push(value),
        complete: () => results.push(999)
      })
    })
    registerObservable('getFromClient', interval(100).pipe(take(5)), client)

    setTimeout(() => {
      expect(results).toEqual([0,1,2])
    }, 350)
    setTimeout(() => {
      expect(results).toEqual([0,1,2,3,4,999])
      done()
    }, 550)
  })

  it ('client unsubscribes before servers observable completes', (done) => {
    const serverEmits: number[] = []
    server.addListener('connection', connection => {
      registerObservable<void, number>('getFromServer', defer(() => interval(100).pipe(
        take(5),
        tap(value => serverEmits.push(value))
      )), connection)
    })
    bindObservable<number>('getFromServer', null, client).pipe(take(3)).subscribe()
    setTimeout(() => {
      expect(serverEmits).toEqual([0,1,2])
      done()
    }, 550)
  })

  it ('uploads file', (done) => {
    const result: Buffer[] = []

    server.addListener('connection', connection => {
      bindObservable<Buffer>(FILE_ID, null, connection, {
        subscribe(id, subscriber) { listeners.set(id, subscriber) },
        unsubscribe(id) { listeners.delete(id) }
      }).subscribe({
        next: value => result.push(value)
      })

      registerObservable(FILE_ID, NEVER, client, {
        subscribe(id) { void sendFile(id, (appServer.address() as AddressInfo).port, Readable.from(['test1', 'test2', 'test3'])) }
      })
    })
    setTimeout(() => {
      expect(result).toEqual([Buffer.from('test1'), Buffer.from('test2'), Buffer.from('test3')])
      done()
    }, 1000)
  })

  it ('throws error if source not found for pipe', (done) => {
    const result: string[] = []

    server.addListener('connection', connection => {
      bindObservable<Buffer>('throwsError', null, connection).subscribe({
        error: value => result.push(value),
        next: console.log
      })

      registerObservable('throwsError', mapTo('test'), client)
    })
    setTimeout(() => {
      expect(result).toEqual([NOT_FOUND_STREAM_ERROR])
      done()
    }, 1000)
  })
})
