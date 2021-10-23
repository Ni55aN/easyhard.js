import { createRequire } from 'module'
const require = createRequire(import.meta.url)

export const mainPkg = require('../../package.json')
export const packages = ['common', 'core', 'styles', 'router', 'loader', 'api', 'bridge', 'client', 'server', 'server-uws'].map(folder => ({
  folder,
  pkg: require(`../../packages/${folder}/package.json`)
}))
