import { resolve } from 'path'

export function getEasyhardWebpackConfig(cwd: string) {
  return {
    resolve: {
      alias: {
        'rxjs-alias': resolve(cwd, 'node_modules/rxjs'),
        'easyhard-common-alias': resolve(cwd, 'node_modules/easyhard-common'),
        'easyhard-alias': resolve(cwd, 'node_modules/easyhard'),
        'rxjs/operators': resolve(cwd, 'node_modules/easyhard-debug/rx.esm'),
        'rxjs': resolve(cwd, 'node_modules/easyhard-debug/rx.esm'),
        'easyhard': resolve(cwd, 'node_modules/easyhard-debug/core.esm'),
        'easyhard-common': resolve(cwd, 'node_modules/easyhard-debug/common.esm')
      },
    }
  }
}
