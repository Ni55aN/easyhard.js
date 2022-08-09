import { Socket } from 'rete'

export const variable = new Socket('Variable');
export const value = new Socket('Value');
export const func = new Socket('Func');
export const obj = new Socket('Obj');
export const any = new Socket('Any');

variable.combineWith(obj)

any.combineWith(variable)
any.combineWith(value)
any.combineWith(func)
any.combineWith(obj)
variable.combineWith(any)
value.combineWith(any)
func.combineWith(any)
obj.combineWith(any)
