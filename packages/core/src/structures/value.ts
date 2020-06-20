import { BehaviorSubject } from "rxjs";

export const $ = <T>(val: T): BehaviorSubject<T> => new BehaviorSubject(val);
export type $<T> = BehaviorSubject<T>;