import { h, $, $$, Child, $for, DomElement, $if } from 'easyhard';
import { map, mergeMap, tap } from 'rxjs/operators';
import { Observable, of, interval } from 'rxjs';

type TabItem = { label: Child, content: Child, hidden?: Observable<boolean> };
type TabHeaderComponent = (item: TabItem, active: Observable<boolean>, selected: () => void) => DomElement;

const TabComponent: TabHeaderComponent = (item, active, selected) => {
  const styles = 'display: inline-block; cursor: pointer; padding: 1em 2em;';

  return h('div', { click: selected, style: active.pipe(map(ac => ac ? styles+' border-bottom: 2px solid blue' : styles)) }, item.label);
}

function useTabs(list: $$<TabItem>, component: TabHeaderComponent = TabComponent) {
  const active = $<TabItem | null>(null);

  return {
    selectTab(i: number) {
      active.next(list.value[i]);
    },
    header: $for(list, mergeMap(item => {
      const isActive = active.pipe(map(activeItem => item === activeItem));
      const label = map(() => component(item, isActive, () => active.next(item)));

      return item ? $if(item.hidden || of(false), map(() => null), label) : of(null);
    })),
    content: active.pipe(mergeMap(tab => {
      if (!tab) return of(null);
  
      return tab.content instanceof Observable ? tab.content : of(tab.content);
    }))
  };
}


function App() {
  const tabs = [
    { label: $('Tab 1'), content: $('Content 1') },
    { label: $('Tab 2'), content: $('Content 2'), hidden: $(true) },
    { label: $('Tab 3'), content: $('Content 3') },
    { label: $('Tab 4'), content: $('Content 4') },
  ];
  const { header, content, selectTab } = useTabs($$(tabs));
  const switchEverySecond = interval(1000).pipe(tap(i => selectTab(i%tabs.length)), map(() => null));

  return h('div', {},
    switchEverySecond,
    header,
    h('div', {}, content)
  );
}

document.body.appendChild(App());