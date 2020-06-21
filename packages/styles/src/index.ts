import { untilExist, Child, $ } from 'easyhard'
import { Observable, combineLatest, pipe, MonoTypeOperatorFunction } from 'rxjs'

type CssSimpleValue = string | number;
type CssValue = CssSimpleValue | Observable<string | number>;
type StyleBasicDeclaration = {[key in keyof CSSStyleDeclaration]?: CssValue };
type CssMediaValue = string | boolean;
type CssMediaItem = [MediaKeys, CssMediaValue | Observable<CssMediaValue>];
type CssMedia = StyleDeclaration & {
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
type MediaKeys = keyof CssMedia['query'];
export type StyleDeclaration = StyleBasicDeclaration & {
    '@media'?: CssMedia;
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
type RootStyleDeclaration = StyleDeclaration & {
    $name?: string;
}
type Style = { className: string; style: HTMLStyleElement };

function getUID(): string {
    return (Date.now()+Math.random()).toString(36).replace('.', '');
}

export function px(val: number): string {
    return `${val}px`;
}

function prepareCssValue(val: CssSimpleValue): string {
    return typeof val === 'number' ? px(val) : val;
}

function stringifyMedia(args: [MediaKeys, CssMediaValue][]): string {
    return args.map(([key, value]: [MediaKeys, CssMediaValue]) => {
        switch (key) {
            case 'maxWidth': return `(max-width: ${value})`;
            case 'minWidth': return `(min-width: ${value})`;
            case 'orientation': return `(orientation: ${value})`;
            default: return value;
        }
    }).join(' and ');
}

function untilExistStyle<T>(style: HTMLStyleElement, parent: ChildNode | null): MonoTypeOperatorFunction<T> {
    return parent ? pipe(untilExist<T>(style, document.head), untilExist(parent)) : untilExist<T>(style, document.head);
}

function injectCssProperties(selector: string, media: CssMediaItem[], style: HTMLStyleElement, props: StyleDeclaration, head: HTMLHeadElement, parent: ChildNode | null): void {
    const sheet = style.sheet as CSSStyleSheet;
    const len = sheet.cssRules.length;
    sheet.insertRule(media.length > 0 ? `@media {${selector} {}}`: `${selector} {}`, len);
    const rule = sheet.cssRules.item(len) as CSSStyleRule | CSSMediaRule;
    const ruleStyles = rule instanceof CSSMediaRule ? (rule.cssRules[0] as CSSStyleRule).style : rule.style;

    if (rule instanceof CSSMediaRule) {
        const mediaObservable = media.filter(([_, value]) => value instanceof Observable);
        const mediaStatic = media.filter(([_, value]) => !(value instanceof Observable)) as [MediaKeys, CssMediaValue][];

        rule.media.mediaText = stringifyMedia(mediaStatic);

        combineLatest<CssMediaValue[]>(...mediaObservable.map(([_, value]) => value as Observable<CssMediaValue>))
            .pipe(untilExistStyle(style, parent))
            .subscribe((args: CssMediaValue[]) => {
                const mediaUpdated = args.map((ob, i) => [mediaObservable[i][0], ob] as [MediaKeys, CssMediaValue]);
                rule.media.mediaText = stringifyMedia([...mediaUpdated, ...mediaStatic]);
            })
    }

    for (const key in props) {
        const val = props[key];

        if (key === '@media') {
            const nestedProps = props[key] as unknown as CssMedia;
            const  { query, ...localProps } = nestedProps;
            const localMedia = [...Object.entries(query), ...media] as CssMediaItem[];

            injectCssProperties(selector, localMedia, style, localProps as StyleDeclaration, head, parent);
        } else if (key === '@import') {
            sheet.insertRule(`@import ${val}`)
        } else if (key.startsWith(':')) {
            const localProps = props[key] as unknown as StyleDeclaration;

            injectCssProperties(`${selector}${key}`, media, style, localProps, head, parent);
        } else if (val instanceof Observable) {
            val.pipe(untilExistStyle(style, parent)).subscribe(value => ruleStyles[key] = prepareCssValue(value));
        } else if (val !== undefined) {
            ruleStyles[key] = prepareCssValue(val);
        }
    }
}

export function css(object: RootStyleDeclaration, parent: ChildNode | null = null): { className: string; style: HTMLStyleElement } {
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    const className = `eh_${object.$name || ''}_${getUID()}`;

    style.type = 'text/css';
    head.appendChild(style);

    injectCssProperties(`.${className}`, [], style, object, head, parent);

    return { className, style };
}

export function injectStyles(...styles: (RootStyleDeclaration | Style)[]): Child {
    const anchor = document.createTextNode('');

    $(null).pipe(untilExist(anchor)).subscribe(() => {
        (anchor.parentNode as HTMLElement).className = styles.map((obj): string => {
            if ('className' in obj) return obj.className;

            const { className } = css(obj, anchor);
            return className;
        }).join(' ');
        return null;
    });
    return anchor;
}