import { ExtractPayload, ObjectMapping, RequestMapper } from 'easyhard-bridge'

export type ConnectionArgs = { http: string }
export type JSONPayload<T> = ObjectMapping<ExtractPayload<T, 'request'>, RequestMapper, 0, 1>
