import { h, $if, $, $inject, $provide, DomElement } from 'easyhard';
import { map, mergeMap, takeWhile, startWith, share, shareReplay } from 'rxjs/operators';
import { of, Observable, interval } from 'rxjs';

type Modal = { opened: $<boolean>; title: $<string>, content: $<string> }
type ModalComponent = (title: Observable<string>, content?: Observable<string | null>) => DomElement;

const Modal: ModalComponent = (title: Observable<string>, content?: Observable<string | null>) => {
  return h('div', {
      style: 'background: #ddd; position: absolute; z-index: 5; border: 1px solid red; padding: 0 1em; width: 20em; left: 0; right: 0; top: 25%; margin: auto'
    },
    h('h3', {}, title),
    h('p', {}, content)
  );
}

function useModal(component: ModalComponent = Modal) {
  const modal: $<Modal> = new $<Modal>({ opened: new $<boolean>(false), title: new $(''), content: new $('') });
  const opened = modal.pipe(mergeMap(m => m.opened));

  return {
    opened,
    open(title: Observable<string>, content: Observable<string>) {
      modal.value.opened.next(true);
      title.pipe(takeWhile(() => modal.value.opened.value)).subscribe(t => modal.value.title.next(t));
      content.pipe(takeWhile(() => modal.value.opened.value)).subscribe(t => modal.value.content.next(t));
    },
    close() {
      modal.value.opened.next(false);
    },
    inject: $inject(useModal, modal),
    outlet() {
      return [
        $provide(useModal, modal),
        $if(opened, map(() => component(
          modal.pipe(mergeMap(m => m.title)),
          modal.pipe(mergeMap(m => m.content || of(null)))
        )))
      ];
    }
  }
}


const CustomModal: ModalComponent = (title: Observable<string>, content?: Observable<string | null>) => {
  return h('div', {
      style: 'background: #d66; position: absolute; z-index: 5; border: 1px solid red; padding: 0 1em; width: 20em; left: 0; right: 0; top: 25%; margin: auto'
    },
    h('h3', {}, title),
    h('p', {}, content)
  );
}

const Ob = {
  not(ob: Observable<boolean>) {
    return ob.pipe(map(v => !v));
  }
}

function Section() {
  const { inject, open, close, opened } = useModal();
  const {
    outlet,
    open: openNested,
    close: closeNested,
    opened: openedNested
  } = useModal(CustomModal);

  return h('div', { style: 'margin: 3em 3em 3em 20em; height: 80vh; background: #888; border: 2px solid green; position: relative' },
    inject,
    outlet(),
    h('button', { click() { open(new $('Title!'), new $('Content!')) }, disabled: opened }, 'Open modal'),
    h('button', { click() { close() }, disabled: Ob.not(opened) }, 'Close modal'),
    h('button', { click() { openNested(new $('Title nested'), new $('Content nested')) }, disabled: openedNested }, 'Open nested modal'),
    h('button', { click() { closeNested() }, disabled: Ob.not(openedNested) }, 'Close nested modal')
  )
}

function App() {
  const { outlet, open, close, opened } = useModal();
  const modalTitle = interval(500).pipe(startWith(0), map(t => `Title ${t}`), shareReplay());

  return h('div', {},
    outlet(),
    h('button', { click() { open(modalTitle, new $('Content')) }, disabled: opened }, 'Open modal'),
    h('button', { click: close, disabled: Ob.not(opened) }, 'Close modal'),
    Section()
  );
}

document.body.appendChild(App());