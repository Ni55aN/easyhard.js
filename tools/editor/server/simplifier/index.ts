import { Core } from 'cytoscape'
import { Transformer } from './transformers/interface'

export class Simplifier {
  constructor(private transformers: Transformer[]) {}

  forward(cy: Core) {
    this.transformers.slice().forEach(transformer => {
      transformer.forward(cy)
    })
  }

  backward(cy: Core) {
    this.transformers.slice().reverse().forEach(transformer => {
      transformer.backward(cy)
    })
  }
}
