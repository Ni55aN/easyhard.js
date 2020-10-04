import { h, $, Child } from 'easyhard'
import { map, mapTo, startWith, shareReplay } from 'rxjs/operators';
import { Subject, merge } from 'rxjs';
import { Observable } from 'rxjs';

function switcher<T, K>(a: Subject<T>, b: Subject<K>) {
  return merge(a.pipe(mapTo(true)), b.pipe(mapTo(false))).pipe(startWith(false), shareReplay(1))
}

function Hoverable(content: (active: Observable<boolean>) => Child) {
  const mouseenter = new Subject<MouseEvent>()
  const mouseleave = new Subject<MouseEvent>()
  const hovered = switcher(mouseenter, mouseleave)

  return h('div', { mouseenter, mouseleave },
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