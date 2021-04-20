import { h } from 'easyhard'
import { Observable, timer } from 'rxjs'
import jss, { Plugin, Rule } from 'jss'
import preset from 'jss-preset-default'
import { map } from 'rxjs/operators'

jss.setup(preset())

const plugin = (updateOptions: any): Plugin => ({
  onProcessRule(rule: Rule) {
    if (rule && rule.type !== 'style') return
    
    const styleRule = rule as any
    const { style } = styleRule

    for (const prop in style) {
      const value = style[prop]
      if (!value || !value.subscribe) continue

      delete style[prop]
      value.subscribe({
        next: (nextValue: any) => {
          styleRule.prop(prop, nextValue, updateOptions)
        }
      })
    }
  }
})

jss.use(plugin({}))

const renderStyles = (style: any) => {
  const {classes} = jss.createStyleSheet({
    box: style
  }, {link: true}).attach()
  
  return classes.box
}

const styles = (props: { color: Observable<string> }) => ({
  color: props.color,
  fontSize: 54
})

function App() {
  const color = timer(0, 1000).pipe(map(v => v%2?'red':'green'))
  const className = renderStyles(styles({ color }))
    
  return h('button', { className }, 'CSS-in-JS')
}

document.body.appendChild(App())