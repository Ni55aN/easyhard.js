import { h, untilExist, Child, $ } from 'easyhard';
import { Observable, timer, combineLatest, pipe } from 'rxjs'
import { map, tap } from 'rxjs/operators';

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
    }
};
type MediaKeys = keyof CssMedia['query'];
type StyleDeclaration = StyleBasicDeclaration & {
    '@media'?: CssMedia;
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

function getUID() {
    return (Date.now()+Math.random()).toString(36).replace('.', '');
}

function px(val: number) {
    return `${val}px`;
}

function prepareCssValue(val: CssSimpleValue) {
    return typeof val === 'number' ? px(val) : val;
}

function stringifyMedia(args: [MediaKeys, CssMediaValue][]) {
    return args.map(([key, value]: [MediaKeys, CssMediaValue]) => {
        switch (key) {
            case 'maxWidth': return `(max-width: ${value})`;
            case 'minWidth': return `(min-width: ${value})`;
            case 'orientation': return `(orientation: ${value})`;
            default: return value;
        }
    }).join(' and ');
}

function untilExistStyle<T>(style: HTMLStyleElement, parent: ChildNode | null) {
    return parent ? pipe(untilExist<T>(style, document.head), untilExist(parent)) : untilExist<T>(style, document.head);
}

function injectCssProperties(selector: string, media: CssMediaItem[], style: HTMLStyleElement, props: StyleDeclaration, head: HTMLHeadElement, parent: ChildNode | null) {
    const sheet = style.sheet as CSSStyleSheet;
    const len = sheet.cssRules.length;
    sheet.insertRule(media.length > 0 ? `@media {${selector} {}}`: `${selector} {}`, len);
    const rule = sheet.cssRules.item(len) as CSSStyleRule | CSSMediaRule;
    const ruleStyles = rule instanceof CSSMediaRule ? (rule.cssRules[0] as CSSStyleRule).style : rule.style;

    if (rule instanceof CSSMediaRule) {
        const mediaObservable = media.filter(([key, value]) => value instanceof Observable);
        const mediaStatic = media.filter(([key, value]) => !(value instanceof Observable)) as [MediaKeys, CssMediaValue][];

        rule.media.mediaText = stringifyMedia(mediaStatic);

        combineLatest<CssMediaValue[]>(...mediaObservable.map(([key, value]) => value as Observable<CssMediaValue>))
            .pipe(untilExistStyle(style, parent))
            .subscribe((args: CssMediaValue[]) => {
                const mediaUpdated = args.map((ob, i) => [mediaObservable[i][0], ob]) as [MediaKeys, CssMediaValue][];
                rule.media.mediaText = stringifyMedia([...mediaUpdated, ...mediaStatic]);
            })
    }

    for (let key in props) {
        const val = props[key];

        if (key.startsWith('@')) {
            const nestedProps = props[key] as unknown as CssMedia;
            const  { query, ...localProps } = nestedProps;
            const localMedia = [...Object.entries(query), ...media] as CssMediaItem[];

            injectCssProperties(selector, localMedia, style, localProps as StyleDeclaration, head, parent);
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

function css(object: RootStyleDeclaration, parent: ChildNode | null = null) {
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    const className = `eh_${object.$name || ''}_${getUID()}`;

    style.type = 'text/css';
    head.appendChild(style);

    injectCssProperties(`.${className}`, [], style, object, head, parent);

    return { className, style };
}

function injectStyles(...styles: (RootStyleDeclaration | Style)[]): Child {
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

const colorTransitionStyle = (props: { color: Observable<string> }): StyleDeclaration => ({
    color: props.color,
    transition: 'color 1s'
});

const staticCss = css({
    $name: 'test',
    background: 'grey',
    fontSize: 50,
    ':hover': {
        borderColor: timer(0, 500).pipe(map(t => t%2?'red':'blue')),
        borderStyle: 'solid',
        borderWidth: px(4),
        ':focus': {
            background: 'black'
        }
    },
    '@media': {
        query: {
            minWidth: timer(0, 500).pipe(map(v => px(v+500)))
        },
        color: 'green'
    }
});

function App() {
    const color = timer(0, 1000).pipe(map(v => v % 2 === 0 ? 'red' : 'yellow'));

    return h('div', {}, 
        h('button', {}, injectStyles(colorTransitionStyle({ color }), staticCss), 'Dynamic'),
        h('button', { className: staticCss.className }, 'Static')
    );
}

document.body.appendChild(App());