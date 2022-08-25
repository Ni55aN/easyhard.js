import { ElementDefinition } from 'cytoscape'
import { OperatorFunction } from 'rxjs'

export type Actions = {
  openFile: OperatorFunction<{ path: string }, { data: ElementDefinition[] }>
}
