import { h, $, Child } from 'easyhard'
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

function Hoverable(content: (active: Observable<boolean>) => Child) {
  const hovered = $(false)

  return h('div', { mouseenter() { hovered.next(true) }, mouseleave() { hovered.next(false) } },
    content(hovered)
  )
}

const getBlockStyles = map((active: boolean) => `
  margin: 0.5em;
  padding: 1em 0.5em;
  background: ${active ? '#ff3e00' : '#eee'};
  color: ${active ? 'white' : 'black'};
`)

function App() {
  return h('div', {},
    Hoverable(active => h('div', { style: getBlockStyles(active) }, active.pipe(map(is => is ? 'I am being hovered upon.' : 'Hover over me!')))),
    Hoverable(active => h('div', { style: getBlockStyles(active) }, active.pipe(map(is => is ? 'I am being hovered upon.' : 'Hover over me!')))),
    Hoverable(active => h('div', { style: getBlockStyles(active) }, active.pipe(map(is => is ? 'I am being hovered upon.' : 'Hover over me!'))))
  );
}

document.body.appendChild(App());