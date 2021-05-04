import { Child, createAnchor, onLife } from 'easyhard'
import { getUID } from 'easyhard-common'
import { Observable, combineLatest } from 'rxjs'
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

function injectCssProperties(selector: string, media: CssMediaItem<StyleDeclaration>[], style: HTMLStyleElement, props: StyleDeclaration, head: HTMLHeadElement, parent: ChildNode | null): void {
    const sheet = style.sheet as CSSStyleSheet
    const len = sheet.cssRules.length
    sheet.insertRule(media.length > 0 ? `@media {${selector} {}}`: `${selector} {}`, len)

    const rule = sheet.cssRules[len] as CSSStyleRule | CSSMediaRule
    const ruleStyles = rule instanceof CSSMediaRule ? (rule.cssRules[0] as CSSStyleRule).style : rule.style

    if (rule instanceof CSSMediaRule) {
        const mediaObservable = media.filter(([_, value]) => value instanceof Observable)
        const mediaStatic = media.filter(([_, value]) => !(value instanceof Observable)) as [MediaKeys<StyleDeclaration>, CssMediaValue][]

        rule.media.mediaText = stringifyMedia<StyleDeclaration>(mediaStatic)

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

            injectCssProperties(selector, localMedia, style, localProps as StyleDeclaration, head, parent)
        } else if (key === '@import') {
            sheet.insertRule(`@import ${val as string}`)
        } else if (key.startsWith(':')) {
            const localProps = props[key] as unknown as StyleDeclaration

            injectCssProperties(`${selector}${key}`, media, style, localProps, head, parent)
        } else if (val instanceof Observable) {
            val.pipe(untilExistStyle(style, parent)).subscribe(value => ruleStyles.setProperty(toHyphenCase(key), prepareCssValue(value)))
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

    injectCssProperties(`.${className}`, [], style, object, head, parent)

    return { className, style }
}

export function injectStyles(...styles: (RootStyleDeclaration | Style)[]): Child {
    const anchor = createAnchor()

    onLife(anchor, () => {
        const element =  anchor.parentNode as HTMLElement
        const styleElements: HTMLStyleElement[] = []
        const classNames = styles.map((obj): string => {
            if ('className' in obj) return obj.className

            const { className, style } = css(obj, anchor)
            styleElements.push(style)
            return className
        })

        element.classList.add(...classNames)

        return () => {
            styleElements.slice().forEach(el => el.remove())
        }
    })
    return anchor
}
