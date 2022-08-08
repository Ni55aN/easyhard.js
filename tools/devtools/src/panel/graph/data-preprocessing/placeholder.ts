import { CollectionReturnValue, CollectionArgument } from 'cytoscape'

export class PlaceholderPreprocessing {
  constructor(private elementsGetter: () => CollectionReturnValue) {}

  add(eles: cytoscape.ElementDefinition[]) {
    const placeholderElements = this.elementsGetter().filter(n => n.data('placeholder'))
    const newPlaceholderElements = placeholderElements.filter(n => {
      return Boolean(eles.find(el => n.data('id') === el.data.id))
    })

    newPlaceholderElements.forEach(node => {
      const data = eles.find(el => el.data.id === node.data('id'))?.data

      node.data(data)
    })

    return eles
  }

  remove(eles: CollectionArgument) {
    return eles
  }
}
