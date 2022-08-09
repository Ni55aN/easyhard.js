import * as React from 'react'
import _ from 'lodash'
import{ Control, NodeEditor } from 'rete'

type ButtonProps = { label: string, click?: () => void }
export class Button extends Control {
  render: string
  component: any
  props: ButtonProps & { emitter: NodeEditor }
  constructor(emitter: NodeEditor, key: string, label: string, events: { click?: () => void } = {}) {
    super(key);
    this.render = "react";
    this.component = (props: { click?: () => void, label: string }) => {
      // console.log('render', props.click)
      return <button onClick={props.click}>{label}</button>
    }
    this.props = {
      emitter,
      label,
      click: events.click
    };
  }
}
