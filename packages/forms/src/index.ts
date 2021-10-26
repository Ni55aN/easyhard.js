import { Group } from './types'
import { useValidation } from './validation'

export function useForm<T extends Group>(form: T): { form: T } & ReturnType<typeof useValidation> {
  const validation = useValidation()

  return {
    form,
    ...validation
  }
}

export * from './types'
export * as validation from './validation'
export * as formatter from './formatter'
export * as components from './components'
