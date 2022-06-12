import { h, $if, $, $inject, $provide, DomElement } from 'easyhard'
import { map, mergeMap, startWith, shareReplay, tap } from 'rxjs/operators'
import { of, Observable, interval, combineLatest } from 'rxjs'
import { takeUntilChanged } from '../operators/until-changed'
import { not } from '../utils/observables'

type Modal = { opened: $<boolean>; title: $<string>, content: $<string> }
type ModalComponent = (title: Observable<string>, content?: Observable<string | null>) => DomElement;

const Modal: ModalComponent = (title: Observable<string>, content?: Observable<string | null>) => {
  return h('div', {
    style: 'background: #ddd; position: absolute; z-index: 5; border: 1px solid red; padding: 0 1em; width: 20em; left: 0; right: 0; top: 25%; margin: auto'
  },
  h('h3', {}, title),
  h('p', {}, content)
  )
}

function useModal(component: ModalComponent = Modal) {
  const modal: $<Modal> = $<Modal>({ opened: $<boolean>(false), title: $(''), content: $('') })
  const opened = modal.pipe(mergeMap(m => m.opened))

  return {
    modal,
    opened,
    open(title: Observable<string>, content: Observable<string>) {
      modal.value.opened.next(true)
      combineLatest(title, content).pipe(takeUntilChanged(opened, 1)).subscribe(([t, c]) => {
        modal.value.title.next(t)
        modal.value.content.next(c)
      })
    },
    close() {
      modal.value.opened.next(false)
    },
    provide() {
      return [
        $if(opened, () => component(
          modal.pipe(mergeMap(m => m.title)),
          modal.pipe(mergeMap(m => m.content || of(null)))
        ))
      ]
    }
  }
}

const MainModal: ModalComponent = (title: Observable<string>, content?: Observable<string | null>) => {
  return h('div', {
    style: 'background: #d66; position: absolute; z-index: 5; border: 1px solid red; padding: 0 1em; width: 20em; left: 0; right: 0; top: 25%; margin: auto'
  },
  h('h3', {}, title),
  h('p', {}, content)
  )
}

function useMainModal() {
  const props = useModal(MainModal)

  return {
    ...props,
    consume() {
      return $inject(useMainModal, props.modal)
    },
    provide() { return [$provide(useMainModal, props.modal), props.provide()] }
  }
}

function Section() {
  const mainModal = useMainModal()
  const modal = useModal()

  return h('div', { style: 'margin: 3em 3em 3em 20em; height: 80vh; background: #888; border: 2px solid green; position: relative' },
    mainModal.consume(),
    modal.provide(),
    h('button', { click: tap(() => mainModal.open($('Title!'), $('Content!'))), disabled: mainModal.opened }, 'Open modal'),
    h('button', { click: tap(() => mainModal.close()), disabled: not(mainModal.opened) }, 'Close modal'),
    h('button', { click: tap(() => modal.open($('Title nested'), $('Content nested'))), disabled: modal.opened }, 'Open nested modal'),
    h('button', { click: tap(modal.close), disabled: not(modal.opened) }, 'Close nested modal')
  )
}

function App() {
  const mainModal = useMainModal()
  const modalTitle = interval(500).pipe(startWith(0), map(t => `Title ${t}`), shareReplay())

  return h('div', {},
    mainModal.provide(),
    h('button', { click: tap(() => mainModal.open(modalTitle, $('Content'))), disabled: mainModal.opened }, 'Open modal'),
    h('button', { click: tap(mainModal.close), disabled: not(mainModal.opened) }, 'Close modal'),
    Section()
  )
}

document.body.appendChild(App())
