import { ElementDefinition } from 'cytoscape'
import { Observable } from 'rxjs'

export type Actions = {
  getData: Observable<{
    data: ElementDefinition[]
  }>
}
