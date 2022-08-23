
import { $ } from 'easyhard'

const a = $(1)//, b = v(2)

// eslint-disable-next-line functional/no-expression-statement
a.next(2)
// eslint-disable-next-line functional/no-expression-statement
a.next(3)
