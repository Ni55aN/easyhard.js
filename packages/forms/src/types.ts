import { $ } from 'easyhard'

export type FormValue<T> = $<T>;
export type Group = {
  [key: string]: Control<string> | Control<number> | Control<boolean>
};
export type Control<T> = FormValue<T> | FormValue<T>[] | Group;
