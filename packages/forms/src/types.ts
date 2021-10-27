import { $ } from 'easyhard'
import { $$Return } from 'easyhard-common'
import { Observable } from 'rxjs'

export type FormValue<T> = $<T>;
export type Group = {
  [key: string]: Control<string> | Control<number> | Control<boolean>
};
export type Control<T> = FormValue<T> | Observable<$$Return<FormValue<T> | Group>> | Group;
