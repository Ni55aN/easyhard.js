import { createEditor } from './view';

export type Editor = ReturnType<typeof createEditor> extends Promise<infer U> ? U : never
