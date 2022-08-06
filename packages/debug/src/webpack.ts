import { resolve } from 'path'

export function mergeEasyhardWebpackConfig(cwd: string, config: any) {
  const setupScript = 'easyhard-debug/setup.esm'
  return {
    ...config,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unnecessary-type-assertion
    entry: Object.fromEntries((Object.entries(config.entry) as [string, string | string[]][])
      .map(([name, list]) => ([name, typeof list === 'string' ? [setupScript, list] : [setupScript, ...list]]))),
    resolve: {
      ...(config && config.resolve || {}),
      alias: {
        'rxjs': resolve(cwd, 'node_modules/easyhard-rxjs-debug'),
        'rxjs/operators': resolve(cwd, 'node_modules/easyhard-rxjs-debug/operators'),
        ...(config && config.resolve && config.resolve.alias || {})
      },
    }
  }
}
