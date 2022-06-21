/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { $, $$, $for, h } from 'easyhard'
import { css, injectStyles, RootStyleDeclaration } from 'easyhard-styles'
import { combineLatest, Observable, timer } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'

const nodeStyles = css({
  padding: '1em',
  display: 'inline-block',
  fontSize: '12px',
  background: '#f1c82a',
  border: '2.3px solid black',
  borderRadius: '13px',
  color: 'white',
  width: '65px',
  height: '20px',
  textAlign: 'center',
  verticalAlign: 'middle',
  margin: '0.5em'
})

function Node(props: { id: string }) {
  return h('div', {}, injectStyles(nodeStyles), props.id)
}

const marbleSize = '25px'

const arrowStyles = css({
  width: '100%',
  height: '3px',
  background: 'black'
})

const arrowheadStyles = css({
  transform: 'rotate(-45deg)',
  borderRightWidth: '4',
  borderBottomWidth: '4',
  width: '10px',
  height: '10px',
  position: 'absolute',
  right: '0',
  border: '2px solid black',
  borderLeftWidth: '0',
  borderTopWidth: '0',
  transformOrigin: '0% 50%'
})


function Arrow(props: { styles: RootStyleDeclaration }) {
  return h('div', {}, injectStyles(arrowStyles), injectStyles(props.styles),
    h('div', {}, injectStyles(arrowheadStyles))
  )
}

const stickyLeftBlockStyles = css({
  position: 'sticky',
  left: 0,
  background: 'linear-gradient(90deg, white 0%, white 90%, transparent 100%)',
  display: 'inline-block',
  zIndex: '1'
})

const timelineContainerStyles = css({
  whiteSpace: 'nowrap',
  display: 'inline-block'
})

const timelineStyles = css({
  padding: '1em',
  display: 'inline-block',
  color: 'white',
  position: 'relative',
  height: '35px',
  verticalAlign: 'middle',
  paddingRight: marbleSize
})

const timelineItemStyles = css({
  padding: '1em',
  borderRadius: '30px',
  fontSize: '12px',
  background: 'grey',
  border: '2px solid black',
  color: 'white',
  position: 'absolute',
  width: marbleSize,
  height: marbleSize,
  top: '5px',
  textAlign: 'center',
  lineHeight: '30px'
})

function Timeline<T>(props: { id: string, scale: Observable<number>, now: Observable<number>, start: Observable<number>, data: $$<TableItem<T>> }) {
  const width = combineLatest([props.now, props.scale, props.start]).pipe(map(([now, scale, min]) => `${(now - min) * scale}px`))

  return h('div', {},
    injectStyles(timelineContainerStyles),
    h('div', {}, injectStyles(stickyLeftBlockStyles),
      Node(props)
    ),
    h('div', {},
      injectStyles(timelineStyles),
      injectStyles({ width }),
      Arrow({ styles: css({ position: 'absolute', top: '50%' })}),
      $for(props.data, map(item => {
        const offset = combineLatest([props.scale, props.start]).pipe(map(([scale, min]) => `${(item.time - min) * scale}px`))

        return h('span', {},
          injectStyles(timelineItemStyles),
          injectStyles({ left: offset }),
          String(item.emission)
        )
      }))
    )
  )
}

type TableItem<T> =  { emission: T, time: number, references: { id: string, index: number }[] }
class Table<T> {
  data = $$<{ id: string, data: $$<TableItem<T>> }>([])

  add(id: string, data: TableItem<T>) {
    if (!this.data.getValue().find(v => v.id === id)) this.data.insert({ id, data: $$<TableItem<T>>([]) })

    this.data.getValue().find(v => v.id === id)?.data.insert(data)
  }

  asObservable() {
    return this.data
  }

  getRow(id: string) {
    return this.data.getValue().find(v => v.id === id)
  }

  getStart(): Observable<number> {
    const d = this.data.pipe(mergeMap(() => combineLatest(this.data.getValue().map(m => m.data.pipe(map(() => m.data.getValue()))))))

    return d.pipe(map(v => Math.min(...v.flat().map(item => item.time))))
  }
}


export function createMarbles<T extends string | number | boolean | object>() {
  const table = new Table<T>()
  const scale = $(0.05)
  const start = table.getStart()
  const now = timer(0, 1000/30).pipe(map(() => Date.now()))
  const container = h('div', {}, injectStyles({ overflow: 'auto', maxHeight: '100%' }),
    $for(table.asObservable(), map(item => h('div', {}, Timeline({ scale, now, start, ...item }))))
  )

  container.addEventListener('wheel', e => {
    e.preventDefault()
    scale.next(scale.value * (1 - e.deltaY / 1000))
  })

  return {
    container,
    add(value: T, id: string, parents: string[], time: number) {
      console.log(JSON.stringify({ value, id, parents }))

      const references = parents
        .filter(id => table.getRow(id))
        .map(parentId => {
          const parentEmits = table.getRow(parentId)

          if (!parentEmits) throw new Error('cannot find parentId = ' + parentId)

          return { id: parentId, index: parentEmits.data.getValue().length - 1 }
        })
      table.add(id, { emission: value, time, references })
    }
  }
}
