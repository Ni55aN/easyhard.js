import moduleAlias from 'module-alias'
import { resolve } from 'path'

const cwd = process.cwd()

moduleAlias.addAlias('rxjs-alias', resolve(cwd, 'node_modules/rxjs'))
moduleAlias.addAlias('easyhard-common-alias', resolve(cwd, 'node_modules/easyhard-common'))
moduleAlias.addAlias('rxjs/operators', resolve(cwd, 'node_modules/easyhard-debug/rx.cjs'))
moduleAlias.addAlias('rxjs', resolve(cwd, 'node_modules/easyhard-debug/rx.cjs'))
moduleAlias.addAlias('easyhard-common', resolve(cwd, 'node_modules/easyhard-debug/common.cjs'))

