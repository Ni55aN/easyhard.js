import { Child, createAnchor, onLife, debug } from 'easyhard'
import { getUID } from 'easyhard-common'
import { Observable, combineLatest, Subscription } from 'rxjs'
import { CssMedia, CssMediaItem, CssMediaValue, Keys as MediaKeys, stringifyMedia } from './media'
import { untilExistStyle } from './operators'
import { CssSimpleValue, StyleDeclaration, RootStyleDeclaration, Style } from './types'
import { unit } from './units'
import { toHyphenCase } from './utils'

export * from './types'
export * from './media'
export * from './units'

function prepareCssValue(val: CssSimpleValue): string {
  return typeof val === 'number' ? unit('px')(val) : val
}

function debugStyleAttr(style: HTMLStyleElement, path: string[], sub: Subscription) {
  const attrName = path.join(' ')
  debug.debugElementAttr(style, attrName, sub)
}

function injectCssProperties(selector: string, media: CssMediaItem<StyleDeclaration>[], style: HTMLStyleElement, props: StyleDeclaration, head: HTMLHeadElement, parent: ChildNode | null, debugPath: string[] = []): void {
  const sheet = style.sheet as CSSStyleSheet
  const len = sheet.cssRules.length
  sheet.insertRule(media.length > 0 ? `@media {${selector} {}}`: `${selector} {}`, len)

  const rule = sheet.cssRules[len] as CSSStyleRule | CSSMediaRule
  const ruleStyles = rule instanceof CSSMediaRule ? (rule.cssRules[0] as CSSStyleRule).style : rule.style

  if (rule instanceof CSSMediaRule) {
    const mediaObservable = media.filter(([_, value]) => value instanceof Observable)
    const mediaStatic = media.filter(([_, value]) => !(value instanceof Observable)) as [MediaKeys<StyleDeclaration>, CssMediaValue][]

    rule.media.mediaText = stringifyMedia<StyleDeclaration>(mediaStatic)

    // mediaObservable
    //   .filter(([_, ob]) => ob instanceof Observable)
    //   .forEach(([key, ob]) => debugStyleAttr(style, [...debugPath, 'query', key], ob as Observable<CssMediaValue>))

    combineLatest<CssMediaValue[]>(...mediaObservable.map(([_, value]) => value as Observable<CssMediaValue>))
      .pipe(untilExistStyle(style, parent))
      .subscribe((args: CssMediaValue[]) => {
        const mediaUpdated = args.map((ob, i) => [mediaObservable[i][0], ob] as [MediaKeys<StyleDeclaration>, CssMediaValue])
        rule.media.mediaText = stringifyMedia<StyleDeclaration>([...mediaUpdated, ...mediaStatic])
      })
  }

  for (const key in props) {
    const val = props[key]

    if (key === '@media') {
      const nestedProps = props[key] as unknown as CssMedia<StyleDeclaration>
      const  { query, ...localProps } = nestedProps
      const localMedia = [...Object.entries(query), ...media] as CssMediaItem<StyleDeclaration>[]

      injectCssProperties(selector, localMedia, style, localProps as StyleDeclaration, head, parent, [...debugPath, '@media'])
    } else if (key === '@import') {
      sheet.insertRule(`@import ${val as string}`)
    } else if (key.startsWith(':')) {
      const localProps = props[key] as unknown as StyleDeclaration

      injectCssProperties(`${selector}${key}`, media, style, localProps, head, parent, [...debugPath, key])
    } else if (val instanceof Observable) {
      const sub = val.pipe(untilExistStyle(style, parent)).subscribe(value => ruleStyles.setProperty(toHyphenCase(key), prepareCssValue(value)))
      debugStyleAttr(style, [...debugPath, key], sub)
    } else if (val !== undefined) {
      ruleStyles.setProperty(toHyphenCase(key), prepareCssValue(val))
    }
  }
}

export function css(object: RootStyleDeclaration, parent: ChildNode | null = null): { className: string; style: HTMLStyleElement } {
  const head = document.head || document.getElementsByTagName('head')[0]
  const style = document.createElement('style')
  const className = `eh_${object.$name || ''}_${getUID()}`

  style.type = 'text/css'
  head.appendChild(style)

  debug.debugElement(style)

  injectCssProperties(`.${className}`, [], style, object, head, parent)

  return { className, style }
}

export function injectStyles(...styles: (RootStyleDeclaration | Style)[]): Child {
  const anchor = createAnchor()

  debug.debugFragment(anchor, '$style')

  onLife(anchor, () => {
    const element =  anchor.parentNode as HTMLElement
    const styleElements: HTMLStyleElement[] = []
    const classNames = styles.map((obj): string => {
      if ('className' in obj) {
        debug.debugFragmentAddParent(anchor, obj.style)
        return obj.className
      }

      const { className, style } = css(obj, anchor)
      styleElements.push(style)

      debug.debugFragmentAddParent(anchor, style)
      return className
    })

    element.classList.add(...classNames)

    return () => {
      styleElements.slice().forEach(el => el.remove())
    }
  })
  return anchor
}
