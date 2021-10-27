import { h, $, $$, $if, $for } from 'easyhard'
import { useForm, components, formatter, validation } from 'easyhard-forms'
import { SelectOption } from 'easyhard-forms/components'
import { Observable, pipe } from 'rxjs'
import { map, tap } from 'rxjs/operators'

const { Checkbox, Numbox, Select, Textbox, Field } = components
const { max, min } = formatter
const { maxLength, minLength, required } = validation

function Button(text: string | Observable<string>, click: () => void) {
  return h('button', { click: tap(click) }, text)
}

function App() {
  const { form: formNested, isValid: isValidNested, setValidators: setValidatorsNested } = useForm({
    hello: $('hello')
  })
  const { validations: nestedHelloValidations } = setValidatorsNested(formNested.hello, [required()])

  const items = $$([
    $('111'),
    $('222')
  ])
  const { form, isValid, setValidators } = useForm({
    formNested,
    text: $('1'),
    text2: $('1'),
    checkbox: $<boolean>(false),
    number: $(3),
    select: $('first'),
    items,
    group: {
      test: $(''),
      nested: {
        test: $(false)
      }
    }
  })
  const { validations: textValidations } = setValidators(form.text, [required(), minLength(3), maxLength(8)])
  const { validations: nestedValidations } = setValidators(form.group.nested.test, [map(v => !v)])

  const itemWithValidation = $('333')
  const { validations: itemValidation } = setValidators(itemWithValidation, [required()])

  items.insert(itemWithValidation)

  const selectOptions = $$<SelectOption>([
    $({ key: 'first', label: $('First') }),
    $({ key: 'second', label: $('Second') }),
    $if(form.checkbox, map(() => ({ key: 'third', label: $('Third') })))
  ])

  const disabled = form.checkbox.pipe(map(act => !act))

  return h('div', {},
    Field('Text nested', form.formNested.hello, { type: Textbox(), validations: nestedHelloValidations }),
    h('p', {}, 'Is valid nested:', isValidNested),
    Field('Text Validation', form.text, { type: Textbox(), disabled, validations: textValidations }),
    Field('Text Formatter (max length: 5)', form.text2, {
      type: Textbox(), disabled, formatters: {
        input: map(text => text.substring(0, 5))
      }
    }),
    Field('Active', form.checkbox, { type: Checkbox() }),
    Field('Select', form.select, { type: Select(selectOptions), disabled }),
    Field('Number Formatter (min: 5, max: 8)', form.number, {
      type: Numbox(), formatters: {
        input: pipe(min(5), max(8))
      }
    }),
    h('div', { style: 'border: 1px solid green; padding: 1em' },
      $for(form.items, map(value => Field('Item', value, { type: Textbox(), validations: value === itemWithValidation ? itemValidation : undefined  }))),
    ),
    Field('Nested group', form.group.nested.test, { type: Checkbox(), validations: nestedValidations }),
    Button('Clear', () => form.text.next('')),
    h('p', {}, 'Is valid:', isValid)
  )
}

document.body.appendChild(App())
