import { Observable } from 'rxjs';
import { ParentRoute, Path } from './types';

const parse = (path: string): Path => path.slice(1).split('/');
const stringify = (path: Path): string => `#${path.join('/')}`;

export function toPath(route: ParentRoute | null): Path {
  if (!route) return [];
  const { parent, current } = route;

  return [
    ...(parent ? toPath(parent.value) : []),
    ...(current && current.value ? current.value.path : [])
  ]
}

export function match(path: Path, target: Path): boolean {
  return Boolean(path.join('/').startsWith(target.join('/')))
}

export function fromLocation(): Observable<Path> {
  return new Observable<Path>(observer => {
    const handle = () => observer.next(parse(location.hash));

    window.addEventListener('hashchange', handle, false);
    handle();

    return () => window.removeEventListener('hashchange', handle);
  })
}

export function setLocation(path: Path): void {
  location.hash = stringify(path);
}