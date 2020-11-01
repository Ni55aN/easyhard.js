import { Observable, Observer } from 'rxjs';
import { ParentRoute } from './types';

const parse = (path: string) => path.slice(1);
export const stringify = (path: string) => `#${path}`;
export const getFullPath = (route: ParentRoute | null): string => {
  if (!route) return '';
  const { parent, current } = route;

  return (parent ? getFullPath(parent.value) : '') + (current && current.value ? `${current.value.path as string}/` : '');
}

export function fromLocation() {
  return new Observable<string>((observer: Observer<string>) => {
    const handle = () => observer.next(parse(location.hash));

    window.addEventListener('hashchange', handle, false);
    handle();

    return () => window.removeEventListener('hashchange', handle);
  })
}
