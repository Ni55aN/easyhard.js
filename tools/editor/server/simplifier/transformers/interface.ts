import { Core } from 'cytoscape';

export abstract class Transformer {
  abstract forward(cy: Core): void
  abstract backward(cy: Core): void
}
