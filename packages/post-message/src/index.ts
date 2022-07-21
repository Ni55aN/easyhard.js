/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { getUID } from 'easyhard-common'
import { bindObservable, registerObservable } from 'easyhard-bridge'
import { Observable, OperatorFunction } from 'rxjs'
import { Connection, createConnection } from './connection'
import { mount } from './utils'

type Schema = {[key: string]: Observable<any> | OperatorFunction<any, any>}

type GetNullKeys<T> = {
  [K in keyof T]: T[K] extends null ? K : never;
}[keyof T];

type GetCalls<T> = Omit<T, GetNullKeys<{
  [K in keyof T]: T[K] extends Observable<any> ? K : null
}>>
type GetPipes<T> = Omit<T, GetNullKeys<{
  [K in keyof T]: T[K] extends OperatorFunction<any, any> ? K : null
}>>
type GetInput<T, Key extends keyof GetCalls<T>> = GetCalls<T>[Key] extends Observable<infer I> ? I : never
type GetOperatorInput<T, Key extends keyof GetPipes<T>> = GetPipes<T>[Key] extends OperatorFunction<infer I, any> ? I : never
type GetOperatorOutput<T, Key extends keyof GetPipes<T>> = GetPipes<T>[Key] extends OperatorFunction<any, infer O> ? O : never

export type Requester<T extends Schema> = {
  call<Key extends keyof GetCalls<T>>(key: Key): Observable<GetInput<T, Key>>
  pipe<Key extends keyof GetPipes<T>>(key: Key): OperatorFunction<GetOperatorInput<T, Key>, GetOperatorOutput<T, Key>>
}

export function easyhardRequester<T extends Schema>(target: Connection): Requester<T> {
  const id = getUID()
  const connection = createConnection(target, id)
  type Calls = GetCalls<T>
  type Pipes = GetPipes<T>

  return {
    call<Key extends keyof Calls>(key: Key) {
      type Input = GetInput<T, Key>

      return bindObservable<Input>(key, null, connection)
    },
    pipe<Key extends keyof Pipes>(key: Key) {
      type Input = GetOperatorInput<T, Key>
      type Output = GetOperatorOutput<T, Key>

      return (source: Observable<Input>) => {
        const sourceId = getUID()

        return bindObservable<Output>(key, sourceId, connection).pipe(
          mount(() => {
            const destroy = registerObservable(sourceId, source, connection)

            return () => {
              destroy()
            }
          })
        )
      }
    }
  }
}

export function easyhardResponser<T extends Schema>(target: Connection, handlers: T) {
  const id = getUID()
  const connection = createConnection(target, id)

  Object.keys(handlers).forEach((key: keyof T) => {
    const handler = handlers[key]

    registerObservable(key, handler, connection)
  })
}

