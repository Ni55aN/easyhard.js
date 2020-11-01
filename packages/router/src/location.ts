import { Observable } from 'rxjs';
import { History, Location } from 'history';
import { ParentRoute, Path } from './types';

export function toPath(route: ParentRoute | null): Path {
  if (!route) return [];
  const { parent, current } = route;

  return [
    ...(parent ? toPath(parent.value) : []),
    ...(current && current.value ? current.value.path : [])
  ]
}

export function match(location: Location, target: Path): boolean {
  return Boolean(location.pathname.slice(1).startsWith(target.join('/')))
}

export function fromHistory(history: History): Observable<Location> {
  return new Observable<Location>(observer => {
    observer.next(history.location)
    return history.listen(value => observer.next(value.location))
  })
}
