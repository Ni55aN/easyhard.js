/* eslint-disable @typescript-eslint/prefer-regexp-exec */
import { Observable } from 'rxjs';
import { ParentRoute, Path } from './types';

const parse = (path: string): Path => path.slice(1).split('/');
const stringify = (path: Path): string => `#${path.join('/')}`;

export function getFullPath(route: ParentRoute | null): Path {
  if (!route) return [];
  const { parent, current } = route;

  return [
    ...(parent ? getFullPath(parent.value) : []),
    ...(current && current.value ? current.value.path : [])
  ]
}

export function match(currentPath: Path, routePath: Path): boolean {
  return Boolean(currentPath.join('/').match(routePath.join('/')))
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