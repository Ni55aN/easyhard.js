import { CompleteResponse, Cookie, ErrorResponse, Request, Response, UnsubscribeRequest } from 'easyhard-common'
import { TransformedPayload } from './transform'

export type Transformers = {
  __file: [File, string],
  __cookie: [Cookie, string]
}

export type ConnectionArgs = { http: string }
export type SocketResponse<T> = Response<T, keyof T> | CompleteResponse | ErrorResponse<unknown>
export type SocketRequest<T> = WSPackage<T>
export type WSPackage<T> = (Omit<Request<T, keyof T>, 'payload'> & { payload: TransformedPayload<Transformers> | undefined }) | UnsubscribeRequest
