import { h } from 'easyhard';
import { css, injectStyles, StyleDeclaration, px } from 'easyhard-styles';
import { Observable, timer } from 'rxjs'
import { map } from 'rxjs/operators';

const colorTransitionStyle = (props: { color: Observable<string> }): StyleDeclaration => ({
    color: props.color,
    transition: 'color 1s',
    '@import': 'url("https://fonts.googleapis.com/css?family=Ubuntu:500,400,300")'
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

function App(): HTMLElement {
    const color = timer(0, 1000).pipe(map(v => v % 2 === 0 ? 'red' : 'yellow'));

    return h('div', {}, 
        h('button', {}, injectStyles(colorTransitionStyle({ color })), injectStyles(staticCss), 'Dynamic'),
        h('button', { className: staticCss.className }, 'Static')
    );
}

document.body.appendChild(App());