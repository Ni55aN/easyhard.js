import { h } from 'easyhard'
import { $ } from 'easyhard-common'
import { css } from 'easyhard-styles'
import { map, tap } from 'rxjs/operators'
import { Button } from '../Button'

const stickyLeftStyles = css({
  marginLeft: 0,
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  borderLeft: '1px solid white'
})

const stickyRightStyles = css({
  marginRight: 0,
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
  borderRight: '1px solid white'
})


export function Switch<T extends string>(props: { model: $<T>, options: { label: string, key: T }[] }) {
  return h('span', {},
    props.options.map((option, i) => {
      return Button({
        label: option.label,
        active: props.model.pipe(map(model => model === option.key)),
        click: tap(() => props.model.next(option.key)),
        style: i === 0 ? stickyRightStyles : (i === props.options.length - 1 ? stickyLeftStyles : undefined)
      })
    })
  )
}
