import { h, $, $$, $for, SimpleType, DomElement } from 'easyhard';
import { OperatorFunction, Observable, combineLatest } from 'rxjs';
import { map, mergeMap, tap, debounceTime } from 'rxjs/operators';
import { intersection, difference } from 'lodash-es';

function observeResize() {
  return new Observable((observer) => {
    const handle = () => observer.next({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handle, false);

    return () => window.removeEventListener('resize', handle);
  });
}

function ListView<T>(list: $$<T>, props: { height: number }, render: OperatorFunction<T, DomElement | SimpleType>) {
  const scrollTop = $(0);
  const clientHeight = $(350);
  const visibleList = $$<T>([]);
  function updateList(offset: number) {
    const startIndex = offset;
    const endIndex = offset + Math.ceil(clientHeight.value / props.height);

    const oldItems = visibleList.value;
    const nextItems = list.value.slice(startIndex, endIndex);
    const inters = intersection(oldItems, nextItems);
    const outdated = difference(oldItems, nextItems);
    const recent = difference(nextItems, oldItems);
    const appendNew = visibleList.value[0] === outdated[0];

    // console.log({ visibleList: [...visibleList.value], inters, outdated, recent });
  
    outdated.forEach(item => visibleList.remove(item));
    recent.forEach((item, i) => appendNew ? visibleList.insert(item) : visibleList.insert(item, i));
  }

  const offset = scrollTop.pipe(map(top => Math.floor(top/props.height)));

  return h('div', {
        style: 'height: 100%; overflow: auto',
        scroll: e => scrollTop.next((e.srcElement as HTMLElement).scrollTop)
      },
      h('div', {
          style: list.length.pipe(map(value => `height: ${value * props.height}px; overflow: hidden;`)),
        },
          h('div', { style: offset.pipe(debounceTime(16), tap(updateList), map(value => `transform: translateY(${value * props.height}px)`))},
            $for(visibleList, render),
          )
      )
  )
}

function App() {
  const arr = $$(new Array(10000).fill(0).map((_, i) => i));
  const renderItem = map<number, any>(item => {
    for(let i = 0; i < 10000; i += Math.random()) i += Math.random();
    return h('div', {}, item);
  });

  return h('div', {  style: 'height: 80vh; overflow: auto' },
    // $for(arr, renderItem),
    ListView(arr, { height: 18.4 }, renderItem)
  );
}

document.body.appendChild(App());