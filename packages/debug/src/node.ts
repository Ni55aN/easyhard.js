import moduleAlias from 'module-alias'
import { resolve } from 'path'
import './setup'

const cwd = process.cwd()

moduleAlias.addAlias('rxjs', resolve(cwd, 'node_modules/easyhard-rxjs-debug'))
moduleAlias.addAlias('rxjs/operators', resolve(cwd, 'node_modules/easyhard-rxjs-debug/operators'))

