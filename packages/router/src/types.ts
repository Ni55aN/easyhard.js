import { $ } from 'easyhard';
import { OperatorFunction } from 'rxjs';

export type Route = {
  path: string;
  component: OperatorFunction<null, HTMLElement>
}
export type ParentRoute = {
  current: $<Route | null>;
  parent: $<ParentRoute | null>;
}
