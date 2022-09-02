import { Observable as Ob, OperatorFunction } from 'rxjs'
import { Attrs, ElementType, NestedChild, TagName } from 'easyhard'

type Operator = OperatorFunction<any, any>
type OperatorFactory = (...args: any[]) => Operator
type Observable = Ob<any>
type ObservableFactory = (...args: any[]) => Observable
type EasyhardH = (arg: TagName, attrs: Attrs<TagName>, ...children: NestedChild[]) => ElementType<TagName>
type HtmlElement = Element
