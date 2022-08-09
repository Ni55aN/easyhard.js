
import { Component as ReteComponent } from 'rete'

export abstract class Component extends ReteComponent {
    scope: Scope = 'any'
}
export type Scope = 'any' | 'root' | (new (...args: any[]) => Component)


