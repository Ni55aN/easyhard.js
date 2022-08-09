import { $ } from 'easyhard'
import * as React from 'react'
import { Subject, Subscription } from 'rxjs'
import { Control, NodeEditor } from 'rete'

type TextControlComponentProps = {
  value: string | $<string>
  id: string
  readonly: boolean
  putData: (...arg: any[]) => void
  emitter: NodeEditor
}


class TextControlComponent extends React.Component<TextControlComponentProps> {
  state: { value?: string } = {};
  sub!: Subscription

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe()
  }
  componentDidMount() {
    const { value } = this.props
    if (value instanceof Subject) {
      this.sub = value.subscribe(v => {
        this.setState({
          value: v
        });
      })
    } else {
      this.setState({
        value: this.props.value
      });
      this.props.putData(this.props.id, this.props.value);
    }
  }
  onChange(event: any) {
    const next = event.target.value
    const { value } = this.props
    if (value instanceof Subject) {
      value.next(next)
    } else {
      this.props.putData(this.props.id, next);
      this.props.emitter.trigger("process");
      this.setState({
        value: next
      });
    }
  }

  render() {
    return (
      <input value={this.state.value} onChange={this.onChange.bind(this)} />
    );
  }
}
export class TextControl extends Control {
  render: string
  component: any
  props: TextControlComponentProps
  constructor(emitter: NodeEditor, key: string, value: string | $<string>, readonly: boolean, events: { change?: () => void } = {}) {
    super(key);
    this.render = "react";
    this.component = TextControlComponent;
    this.props = {
      emitter,
      id: key,
      value,
      readonly,
      putData: (key: any, data: any) => {
        this.putData.bind(this)(key, data)
        events.change && events.change()
      }
    };
  }
}
