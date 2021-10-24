import { $ } from 'easyhard'
import { combineLatest, Observable, OperatorFunction } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { FormValue } from './types'

export type Validator<T> = OperatorFunction<T, string | boolean>;

export function minLength(min: number, message?: string): Validator<string> {
  return map(v => v.length >= min || message || 'Text is too short')
}

export function maxLength(max: number, message?: string): Validator<string> {
  return map(v => v.length <= max || message || 'Text is too long')
}

export function required(message?: string): Validator<string | number | boolean> {
  return map(v => Boolean(v) || message || 'Field required')
}

export function useValidation() {
  const validatorsMap = new Map<FormValue<unknown>, Validator<unknown>[]>()
  const validators$ = $(null)

  function setValidators<T>(value: FormValue<T>, validators: Validator<T>[]) {
    if (validators.length) {
      validatorsMap.set(value as FormValue<unknown>, validators as Validator<unknown>[])
    } else {
      validatorsMap.delete(value as FormValue<unknown>)
    }
    validators$.next(null)

    return {
      validations: combineLatest(validators.map(v => value.pipe(v)))
    }
  }

  return {
    isValid: validators$.pipe(switchMap(() => {
      const fields = Array.from(validatorsMap.keys())
      const validations = fields.reduce((acc, field) => {
        const rules = validatorsMap.get(field) || []

        return [...acc, ...rules.map(rule => field.pipe(rule))]
      }, [] as Observable<boolean | string>[])

      return combineLatest(validations).pipe(map(v => v.every(item => item === true)))
    })),
    setValidators
  }
}
