import { Attrs, ElementType, NestedChild, TagName } from 'easyhard'

type EasyhardH = (arg: TagName, attrs: Attrs<TagName>, ...children: NestedChild[]) => ElementType<TagName>
type HtmlElement = Element
