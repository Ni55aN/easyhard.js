import { Observable } from 'rxjs'
import { CssMedia } from './media'

export type CssSimpleValue = string | number;
export type CssValue = CssSimpleValue | Observable<string | number>;
export type StyleBasicDeclaration = {[key in keyof CSSStyleDeclaration]?: CssValue };
export type StyleDeclaration = StyleBasicDeclaration & {
  '@media'?: CssMedia<StyleDeclaration>;
  '@import'?: string;
  ':hover'?: StyleDeclaration;
  ':focus'?: StyleDeclaration;
  ':link'?: StyleDeclaration;
  ':first-child'?: StyleDeclaration;
  ':last-child'?: StyleDeclaration;
  ':enabled'?: StyleDeclaration;
  ':disabled'?: StyleDeclaration;
  ':checked'?: StyleDeclaration;
  ':active'?: StyleDeclaration;
};
export type RootStyleDeclaration = StyleDeclaration & {
  $name?: string;
}
export type Style = { className: string; style: HTMLStyleElement };
