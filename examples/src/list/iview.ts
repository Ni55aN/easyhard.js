import { h, $, $if, Child } from 'easyhard'
import { css, injectStyles } from 'easyhard-styles'
import { Observable } from 'rxjs'
import { map, tap } from 'rxjs/operators'

type AlertType = 'success' | 'info' | 'warning' | 'error'
type Props = {
  type?: Observable<AlertType>;
  closable?: Observable<boolean>;
  showIcon?: Observable<boolean>;
  banner?: Observable<boolean>;
  content?: Child;
  desc?: Child;
  close?: (e: MouseEvent) => void;
}


const cssVariables = {
// Prefix
'@css-prefix': 'ivu-',
'@css-prefix-iconfont': 'ivu-icon',

// Color
'@primary-color': '#2d8cf0',
'@info-color': '#2db7f5',
'@success-color': '#19be6b',
'@processing-color': '@primary-color',
'@warning-color': '#ff9900',
'@error-color': '#ed4014',
'@normal-color': '#e6ebf1',
'@link-color': '#2D8cF0',
'@link-hover-color': 'tint(@link-color, 20%)',
'@link-active-color': 'shade(@link-color, 5%)',
'@selected-color': 'fade(@primary-color, 90%)',
'@tooltip-color': '#fff',
'@subsidiary-color': '#808695',
'@rate-star-color': '#f5a623',
'@white': '#fff',
'@black': '#000',

// Base
'@body-background': '#fff',
'@component-background': '#fff',
'@font-family': '"Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif',
'@code-family': 'Consolas,Menlo,Courier,monospace',
'@title-color': '#17233d',
'@text-color': '#515a6e',
'@text-color-secondary': 'fade(@black, 45%)',
'@heading-color': 'fade(#000, 85%)',
'@heading-color-dark': 'fade(@white, 100%)',
'@font-size-base': '14px',
'@font-size-small': '12px',
'@font-size-large': '@font-size-base + 2px',
'@line-height-base': '1.5',
'@line-height-computed': 'floor((@font-size-base * @line-height-base))',
'@border-radius-base': '6px',
'@border-radius-small': '4px',
'@cursor-disabled': 'not-allowed',

// vertical paddings
'@padding-lg': '24px', // containers
'@padding-md': '16px', // small containers and buttons
'@padding-sm': '12px', // Form controls and items
'@padding-xs': '8px', // small items

// Border color
'@border-color-base': '#dcdee2',  // outside
'@border-color-split': '#e8eaec',  // inside
'@border-width-base': '1px',            // width of the border for a component
'@border-style-base': 'solid',          // style of a components border

// Background color
'@background-color-base': '#f7f7f7',  // base
'@background-color-select-hover': '@input-disabled-bg',
'@tooltip-bg': 'rgba(70, 76, 91, .9)',
'@head-bg': '#f9fafc',
'@table-thead-bg': '#f8f8f9',
'@table-td-stripe-bg': '#f8f8f9',
'@table-td-hover-bg': '#ebf7ff',
'@table-td-highlight-bg': '#ebf7ff',
'@menu-dark-title': '#515a6e',
'@menu-dark-active-bg': '#363e4f',
'@menu-dark-subsidiary-color': 'rgba(255,255,255,.7)',
'@menu-dark-group-title-color': 'rgba(255,255,255,.36)',
'@date-picker-cell-hover-bg': '#e1f0fe',

// Shadow
'@shadow-color': 'rgba(0, 0, 0, .2)',
'@shadow-base': '@shadow-down',
'@shadow-card': '0 1px 1px 0 rgba(0,0,0,.1)',
'@shadow-up': '0 -1px 6px @shadow-color',
'@shadow-down': '0 1px 6px @shadow-color',
'@shadow-left': '-1px 0 6px @shadow-color',
'@shadow-right': '1px 0 6px @shadow-color',

// Button
'@btn-height-base': '32px',
'@btn-height-large': '40px',
'@btn-height-small': '24px',

'@btn-padding-base': '0 @padding-md - 1px',
'@btn-padding-large': '@btn-padding-base',
'@btn-padding-small': '0 @padding-xs - 1px',

'@btn-font-weight': 'normal',
'@btn-padding-base-icon': '5px 15px 6px',
'@btn-padding-large-icon': '6px 15px 6px 15px',
'@btn-padding-small-icon': '1px 7px 2px',
'@btn-font-size': '@font-size-base',
'@btn-font-size-large': '@font-size-large',
'@btn-font-size-small': '@font-size-base',
'@btn-border-radius': '4px',
'@btn-border-radius-small': '3px',
'@btn-group-border': 'shade(@primary-color, 5%)',

'@btn-disable-color': '#c5c8ce',
'@btn-disable-bg': '@background-color-base',
'@btn-disable-border': '@border-color-base',

'@btn-default-color': '@text-color',
'@btn-default-bg': '#fff',
'@btn-default-border': '@border-color-base',

'@btn-primary-color': '#fff',
'@btn-primary-bg': '@primary-color',

'@btn-ghost-color': '@text-color',
'@btn-ghost-bg': '#fff',
'@btn-ghost-border': '@border-color-base',

'@btn-circle-size': '@btn-height-base',
'@btn-circle-size-large': '@btn-height-large',
'@btn-circle-size-small': '@btn-height-small',

'@btn-square-size': '@btn-height-base',
'@btn-square-size-large': '@btn-height-large',
'@btn-square-size-small': '@btn-height-small',

// Layout and Grid
'@grid-columns': '24',
'@grid-gutter-width': '0',
'@layout-body-background': '#f5f7f9',
'@layout-header-background': '#515a6e',
'@layout-header-height': '64px',
'@layout-header-padding': '0 50px',
'@layout-footer-padding': '24px 50px',
'@layout-footer-background': '@layout-body-background',
'@layout-sider-background': '@layout-header-background',
'@layout-trigger-height': '48px',
'@layout-trigger-color': '#fff',
'@layout-zero-trigger-width': '36px',
'@layout-zero-trigger-height': '42px',

// Legend
'@legend-color': '#999',

// Input
'@input-height-base': '32px',
'@input-height-large': '40px',
'@input-height-small': '24px',

'@input-padding-horizontal': '7px',
'@input-padding-vertical-base': '4px',
'@input-padding-vertical-small': '1px',
'@input-padding-vertical-large': '6px',

'@input-placeholder-color': '@btn-disable-color',
'@input-color': '@text-color',
'@input-border-color': '@border-color-base',
'@input-bg': '#fff',
'@input-group-bg': '#f8f8f9',

'@input-hover-border-color': '@primary-color',
'@input-focus-border-color': '@primary-color',
'@input-disabled-bg': '#f3f3f3',

// Tag
'@tag-font-size': '12px',

// Media queries breakpoints
// Extra small screen / phone
'@screen-xs': '480px',
'@screen-xs-min': '@screen-xs',
'@screen-xs-max': '(@screen-xs-min - 1)',

// Small screen / tablet
'@screen-sm': '576px',
'@screen-sm-min': '@screen-sm',
'@screen-sm-max': '(@screen-sm-min - 1)',

// Medium screen / desktop
'@screen-md': '768px',
'@screen-md-min': '@screen-md',
'@screen-md-max': '(@screen-md-min - 1)',

// Large screen / wide desktop
'@screen-lg': '992px',
'@screen-lg-min': '@screen-lg',
'@screen-lg-max': '(@screen-lg-min - 1)',

// Extra large screen / full hd
'@screen-xl': '1200px',
'@screen-xl-min': '@screen-xl',
'@screen-xl-max': '(@screen-xl-min - 1)',

// Extra extra large screen / large descktop
'@screen-xxl': '1600px',
'@screen-xxl-min': '@screen-xxl',
'@screen-xxl-max': '(@screen-xxl-min - 1)',

// Z-index
'@zindex-spin': '8',
'@zindex-affix': '10',
'@zindex-back-top': '10',
'@zindex-select': '900',
'@zindex-modal': '1000',
'@zindex-drawer': '1000',
'@zindex-message': '1010',
'@zindex-notification': '1010',
'@zindex-tooltip': '1060',
'@zindex-transfer': '1060',
'@zindex-loading-bar': '2000',
'@zindex-spin-fullscreen': '2010',

// Animation
'@animation-time': '.3s',
'@animation-time-quick': '.15s',
'@transition-time': '.2s',
'@ease-in-out': 'ease-in-out',

// Slider
'@slider-color': 'tint(@primary-color, 20%)',
'@slider-height': '4px',
'@slider-margin': '16px 0',
'@slider-button-wrap-size': '18px',
'@slider-button-wrap-offset': '-5px',
'@slider-disabled-color': '#ccc',

// Avatar
'@avatar-size-base': '32px',
'@avatar-size-lg': '40px',
'@avatar-size-sm': '24px',
'@avatar-font-size-base': '18px',
'@avatar-font-size-lg': '24px',
'@avatar-font-size-sm': '14px',
'@avatar-bg': '#ccc',
'@avatar-color': '#fff',
'@avatar-border-radius': '@border-radius-small',

// Anchor
'@anchor-border-width': '2px',

// List
// ---
'@list-header-background': 'transparent',
'@list-footer-background': 'transparent',
'@list-empty-text-padding': '@padding-md',
'@list-item-padding': '@padding-sm 0',
'@list-item-meta-margin-bottom': '@padding-md',
'@list-item-meta-avatar-margin-right': '@padding-md',
'@list-item-meta-title-margin-bottom': '@padding-sm',
}

const styles = (props: { withIcon: Observable<boolean>, typeStyle: Observable<{ border: string, backgroundColor: string }> }) => css({
  position: 'relative',
  padding: props.withIcon.pipe(map(w => w ? '8px 48px 8px 38px' : '8px 48px 8px 16px')),
  borderRadius: cssVariables['@border-radius-small'],
  color: cssVariables['@text-color'],
  fontSize: cssVariables['@font-size-small'],
  lineHeight: '16px',
  marginBottom: '10px',
  border: props.typeStyle.pipe(map(t => t.border)),
  backgroundColor: props.typeStyle.pipe(map(t => {
    console.log(t)
    
    return t.backgroundColor
  }))
})

const withDescStyles = css({
  padding: '16px',
  position: 'relative',
  borderRadius: cssVariables['@border-radius-small'],
  marginBottom: '10px',
  color: '@text-color',
  lineHeight: '1.5'
})

const iconStyles = css({
  fontSize: cssVariables['@font-size-large'],
  top: '6px',
  left: '12px',
  position: 'absolute'
})

const messageStyles = css({
  fontSize: '14px',
  color: cssVariables['@title-color'],
  display: 'block'
})

const descStyles = css({
  fontSize: cssVariables['@font-size-small'],
  color: cssVariables['@text-color'],
  lineHeight: '21px',
  textAlign: 'justify'
})


const typeStyles: {[key in AlertType]: { border: string; backgroundColor: string }} = {
  success: {
    border: `${cssVariables['@border-width-base']} ${cssVariables['@border-style-base']} ${cssVariables['@success-color']}`,
    backgroundColor: cssVariables['@success-color']
  },
  info: {
    border: `${cssVariables['@border-width-base']} ${cssVariables['@border-style-base']} ${cssVariables['@primary-color']}`,
    backgroundColor: cssVariables['@primary-color']
  },
  warning: {
    border: `${cssVariables['@border-width-base']} ${cssVariables['@border-style-base']} ${cssVariables['@warning-color']}`,
    backgroundColor: cssVariables['@warning-color']
  },
  error: {
    border: `${cssVariables['@border-width-base']} ${cssVariables['@border-style-base']} ${cssVariables['@error-color']}`,
    backgroundColor: cssVariables['@error-color']
  }
}

function Card({ content, desc, type = $('info' as AlertType), banner = $(false), closable = $(false), showIcon = $(false), close }: Props) {
  const closed = $(false)

  function onClose(e: MouseEvent) {
    closed.next(true)
    close && close(e)
  }

  return $if(closed.pipe(map(v => !v)), map(() => {
    return h('div', {}, injectStyles(styles({ withIcon: showIcon, typeStyle: type.pipe(map(t => typeStyles[t])) }), desc ? withDescStyles : {}),
      $if(showIcon, map(() =>
        h('span', {}, injectStyles(iconStyles), 'icon')
      )),
      h('span', {}, injectStyles(messageStyles), content), // messageClasses
      h('span', {}, injectStyles(descStyles), desc), // descClasses
      $if(closable, map(() =>
        h('a', { click: tap(onClose) }, 'x') // closeClasses
      ))
    )
  }))
}

function App() {
  return h('div', {}, Card({
    content: 'title',
    desc: 'desc'
  }))
}

document.body.appendChild(App())