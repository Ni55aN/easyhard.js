import { Observable } from 'rxjs'

export type CssMediaValue = string | boolean;
export type CssMediaItem<StyleDeclaration> = [Keys<StyleDeclaration>, CssMediaValue | Observable<CssMediaValue>];
export type CssMedia<StyleDeclaration> = StyleDeclaration & {
  query: {
    screen?: boolean | Observable<boolean>;
    hover?: boolean | Observable<boolean>;
    color?: boolean | Observable<boolean>;
    print?: boolean | Observable<boolean>;
    minWidth?: string | Observable<string>;
    maxWidth?: string | Observable<string>;
    speech?: boolean | Observable<boolean>;
    orientation?: 'landscape' | 'portrait' | Observable<'landscape' | 'portrait'>;
  };
};
export type Keys<StyleDeclaration> = keyof CssMedia<StyleDeclaration>['query'];

export function stringifyMedia<StyleDeclaration>(args: [Keys<StyleDeclaration>, CssMediaValue][]): string {
  return args.map(([key, value]) => {
    switch (key) {
      case 'maxWidth': return `(max-width: ${value as string})`
      case 'minWidth': return `(min-width: ${value as string})`
      case 'orientation': return `(orientation: ${value as string})`
      default: return value
    }
  }).join(' and ')
}
