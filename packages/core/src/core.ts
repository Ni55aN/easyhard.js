import { Observable, Subject } from 'rxjs'
import { DomElement, Attrs, Child, PropAttrs, TagName, EventAttrs, EventHandler, EventName, ElementType, NestedChild } from './types'
import { insertNode, createAnchor } from './utils'
import { untilExist } from './operators/until-exist'
import { debugFragment, debugElement, debugElementAttr, debugFragmentChild } from './devtools'

type CreateElement<T extends TagName = TagName> = <K extends T>(arg: K, attrs: Attrs<K>, ...children: NestedChild[]) => ElementType<K>

export const createElement: CreateElement<TagName> = (tag, attrs, ...children) => {
  type K = typeof tag
  const element = document.createElement(tag)

  debugElement(element)

  for (const name in attrs) {
    if (name && attrs.hasOwnProperty(name)) {
      if (`on${name}` in element) {
        const attrName = name as EventName
        const attr = attrs[attrName] as EventHandler<keyof EventAttrs>

        if (attr instanceof Subject) {
          element.addEventListener(attrName, ((e: HTMLElementEventMap[EventName]) => attr.next(e)) as EventListener)
          debugElementAttr(element, name, attr.pipe(untilExist(element)).subscribe(() => 1))
        } else if (attr) {
          const subject = new Subject<HTMLElementEventMap[EventName]>()
          const sub = subject.pipe(untilExist(element), attr).subscribe()

          element.addEventListener(attrName, ((e: HTMLElementEventMap[EventName]) => subject.next(e)) as EventListener)
          debugElementAttr(element, name, sub)
        }
      } else {
        const attrName = name as keyof PropAttrs<K>
        const attr = attrs[attrName]

        if (attr === true) {
          element[attrName] = true as unknown as HTMLElementTagNameMap[K][typeof attrName]
        } else if (attr instanceof Observable) {
          const sub = attr.pipe(untilExist(element)).subscribe(value => {
            element[attrName] = value as unknown as HTMLElementTagNameMap[K][typeof attrName]
          })
          debugElementAttr(element, name, sub)
        } else if (attr !== false && attr != null) {
          element[attrName] = attr as unknown as HTMLElementTagNameMap[K][typeof attrName]
        }
      }
    }
  }

  for (const child of children.flat(Infinity) as Child[]) {
    appendChild(child, element)
  }

  return element
}

export function appendChild(child: Child, parent: ChildNode, after: DomElement = null): DomElement {
  const el = resolveChild(child)
  if (el) {
    insertNode(el, parent, after)
  }
  return el
}

function resolveChild(child: Child): DomElement {
  if (child instanceof Observable) {
    const anchor = createAnchor()

    const sub = child.pipe(untilExist(anchor)).subscribe(v => {
      if (typeof v !== 'object' && anchor.edge instanceof Text) { // performance optimization
        anchor.edge.textContent = v as string
        return
      }
      anchor.edge && anchor.edge.remove()

      if (v instanceof Comment || v instanceof HTMLElement || v instanceof Text) {
        anchor.edge = v
      } else if (v instanceof Observable) {
        const element = resolveChild(v)

        anchor.edge = element
      } else {
        const element = debugElement(document.createTextNode(''))

        element.textContent = v as string
        anchor.edge = element
      }

      debugFragmentChild(anchor.edge, anchor)

      if (anchor.edge) {
        insertNode(anchor.edge, anchor.parentNode as Node, anchor)
      }
    }, null, () => {
      anchor.edge && anchor.edge.remove()
      anchor.remove()
    })

    debugFragment(anchor, '', sub)

    return anchor
  }

  if (typeof child !== 'object') {
    return document.createTextNode(String(child))
  }

  return child
}
