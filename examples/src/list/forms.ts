import { h, $, $$, $for, $if } from 'easyhard';
import { Observable, pipe, OperatorFunction, interval, Observer, combineLatest, observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

type FormValue<T> = $<T>;
type SelectOption = Observable<{ key: string; label: $<string> } | null>;
type Validator<T> = OperatorFunction<T, string | boolean>;
type Formatter<T, K> = OperatorFunction<T, K>;
type InputParams<T> = { disabled?: boolean | Observable<boolean>, formatters?: { input?: FormatterGroup<T>['input']; output?: FormatterGroup<T>['output'] }};
type FieldInput<T> = (v: $<T>, params: InputParams<T>) => HTMLElement;
type FormatterGroup<I> = { output: Formatter<I, string>, input: Formatter<string, I>};

function useFormatter<T>(value: FormValue<T>, props: FormatterGroup<T>) {
  const v = $<string>(String(value.value));

  return {
    next(value: string) { v.next(value); },
    value: value.pipe(props.output),
    injection: v.pipe(props.input, tap(v => value.next(v)))
  }
}


function Field<T, K>(label: string | Observable<string>, value: $<T>, props: { type: FieldInput<T>, validations?: Observable<(string | boolean)[]> } & InputParams<T>) {
  const { type, validations, ...params } = props;

  return h('p', {},
    h('div', {}, label),
    type(value, params),
    validations ? validations.pipe(map(validation =>
      h('div', { style: 'color: red' }, validation.map(result => h('div', {}, result === true ? null : result)))
    )) : null
  );
}

function Checkbox(checked: FormValue<boolean>, params: InputParams<boolean>) {
  return h('input', {
    type: 'checkbox',
    checked,
    change(e: Event) { checked.next((e.target as HTMLInputElement).checked)},
    ...params
  })
}

function Select<T>(options: $$<SelectOption>) {
  return (value: FormValue<T>, params: InputParams<string>) => {
    return h('select', {
        change(e: Event) { value.next((e.target as HTMLSelectElement).value as unknown as T)},
        ...params
      },
      $for(options, pipe(switchMap(option => option), map(option => option &&
        h('option', { value: option.key }, option.label)
      ))
    )
    )
  }
}

function Textbox(value: FormValue<string>, params: InputParams<string>) {
  const { next, injection, value: formattedValue } = useFormatter(value, {
    input: params.formatters && params.formatters.input || pipe(),
    output: params.formatters && params.formatters.output || pipe()
  });
  return h('input', {
      value: formattedValue,
      input(e: Event) {
        next((e.target as HTMLInputElement).value);
      },
      ...params,
    },
    injection
  )
}


function Numbox(value: FormValue<number>, params: InputParams<number>) {
  const { next, injection, value: formattedValue } = useFormatter(value, {
    input: params.formatters && params.formatters.input || map(v => parseFloat(v) || 0),
    output: params.formatters && params.formatters.output || map(v => String(v))
  });

  return h('input', {
      value: formattedValue,
      input(e: Event) {
        next((e.target as HTMLInputElement).value);
      },
      ...params
    },
    injection
  )
}

function Button(text: string | Observable<string>, click: () => void) {
  return h('button', { click }, text);
}

function minLength(min: number, message?: string): Validator<string> {
  return map(v => v.length >= min || message || 'Text is too short');
}
function maxLength(max: number, message?: string): Validator<string> {
  return map(v => v.length <= max || message || 'Text is too long');
}
function required(message?: string): Validator<string | number | boolean> {
  return map(v => Boolean(v) || message || 'Field required');
}

function toNumber() : Formatter<string | number, number> {
  return map(v => typeof v === "string" ? parseFloat(v) || 0 : v);
}
function clamp(min: number, max: number): Formatter<string | number, number> {
  return pipe(toNumber(), map((v: number) => Math.min(Math.max(v, min), max)));
}
function min(min: number): Formatter<string | number, number> {
  return pipe(toNumber(), map((v: number) => Math.max(v, min)));
}
function max(max: number): Formatter<string | number, number> {
  return pipe(toNumber(), map((v: number) => Math.min(v, max)))
}

type Group = {
  [key: string]: Control<string> | Control<number> | Control<boolean>
};
type Control<T> = FormValue<T> | FormValue<T>[] | Group;


function useValidation(form: Group) {
  const validatorsMap = new WeakMap<FormValue<unknown>, Validator<unknown>[]>();
  const validators$ = $(null);

  function setValidators<T>(value: FormValue<T>, validators: Validator<T>[]) {
    validatorsMap.set(value as FormValue<unknown>, validators as Validator<unknown>[]);
    validators$.next(null);

    return {
      validations: combineLatest(validators.map(v => value.pipe(v)))
    }
  }

  return {
    isValid: validators$.pipe(switchMap(() => {
      const fields = Object.keys(form).filter(key => form[key] instanceof Observable).map(key => form[key]) as FormValue<unknown>[];
      const validations = fields.reduce((acc, field) => {
        const rules = validatorsMap.get(field) || [];

        return [ ...acc, ...rules.map(rule => field.pipe(rule)) ];
      }, [] as Observable<boolean | string>[]);
      
      return combineLatest(validations).pipe(map(v => v.every(item => item === true)));
    })),
    setValidators
  }
}


function useForm<T extends Group>(form: T) {
  return {
    form
  }
}


function App() {
  const { form } = useForm({
    text: $('1'),
    text2: $('1'),
    checkbox: $(false),
    number: $(3),
    select: $('first'),
    items: [
      $(''),
      $('67')
    ],
    group: {
      test: $(''),
      fg: {
        test: $('')
      }
    }
  });
  const { isValid, setValidators } = useValidation(form);
  const { validations: textValidations } = setValidators(form.text, [required(), minLength(3), maxLength(8)]);

  const selectOptions = $$<SelectOption>([
    $({ key: 'first', label: $('First')}),
    $({ key: 'second', label: $('Second')}),
    $if(form.checkbox, map(() => ({ key: 'third', label: $('Third') })))
  ]);

  const disabled = form.checkbox.pipe(map(act => !act));

  return h('div', {},
    Field('Text Validation', form.text, { type: Textbox, disabled, validations: textValidations }),
    Field('Text Formatter (max length: 5)', form.text2, { type: Textbox, disabled, formatters: {
      input: map(text => text.substring(0, 5))
    } }),
    Field('Active', form.checkbox, { type: Checkbox }),
    Field('Select', form.select, { type: Select(selectOptions), disabled }),
    Field('Number Formatter (min: 5, max: 8)', form.number, { type: Numbox, formatters: { 
      input: pipe(min(5), max(8))
    }}),
    Button('Clear', () => form.text.next('')),
    h('p', {}, isValid)
  );
}

document.body.appendChild(App());