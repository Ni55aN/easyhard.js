import { CollectionReturnValue, CollectionArgument } from 'cytoscape'

export class ExistingPreprocessing {
  constructor(private elementsGetter: () => CollectionReturnValue) {}

  add(eles: cytoscape.ElementDefinition[]) {
    return eles.filter(el => !this.elementsGetter().toArray().find(n => n.data('id') === el.data.id))
  }

  remove(eles: CollectionArgument) {
    return eles
  }
}
