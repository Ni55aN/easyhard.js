import { createRequire } from 'module'
const require = createRequire(import.meta.url)

export const mainPkg = require('../../package.json')
export const packages = [
  'common',
  'core',
  'styles',
  'router',
  'forms',
  'loader',
  'api',
  'bridge',
  'client',
  'server',
  'server-uws',
  'debug',
  'post-message'
].map(folder => ({
  folder,
  pkg: require(`../../packages/${folder}/package.json`)
}))
