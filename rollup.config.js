import typescript from 'rollup-plugin-typescript2';
import { eslint } from 'rollup-plugin-eslint';
import { terser } from 'rollup-plugin-terser';
import fromEntries from 'fromentries';
import fs from 'fs-extra';
import path from 'path';

const mainPkg = require('./package.json')
const packages = ['common', 'core', 'styles', 'router', 'loader', 'api', 'client', 'server'].map(folder => ({
  folder,
  pkg: require(`./packages/${folder}/package.json`)
}))

const getBanner = (pkg) => `/*!
 * ${pkg.name} v${pkg.version}
 * (c) 2019-${new Date().getFullYear()} ${mainPkg.author}
 * Released under the ${mainPkg.license} license.
 */`

export default packages.map(({ folder, pkg }) => {
  return {
    input: `packages/${folder}/src/index.ts`,
    external: Object.keys(pkg.dependencies || {}),
    output: ['cjs', 'esm'].map(format => {
      return {
        file: `build/${folder}/${format}.js`,
        format,
        exports: 'auto',
        banner: getBanner(pkg)
      }
    }),
    external: ['rxjs', 'rxjs/operators', 'recast', 'easyhard', 'easyhard-common'],
    plugins: [
      eslint(),
      typescript({
        tsconfig: `packages/${folder}/tsconfig.json`,
        useTsconfigDeclarationDir: false,
 		    tsconfigOverride: {
          compilerOptions: {
            declaration: true,
            declarationDir: path.resolve(`build/${folder}/types`),
            baseUrl: '.',
            paths: fromEntries(packages.map(({ folder, pkg }) => [pkg.name, [`../../build/${folder}`]]))
          }
         }
      }),
      {
        name: 'pkg',
        async buildEnd() {
          const { repository, author, license, bugs, homepage } = mainPkg
          const packageJson = {
            ...pkg,
            main: 'cjs',
            module: 'esm',
            repository, author, license, bugs, homepage
          }
          fs.ensureDirSync(`build/${folder}`)
          fs.copyFileSync(path.resolve(`packages/${folder}/package-lock.json`), path.resolve(`build/${folder}/package-lock.json`))
          fs.writeFileSync(path.resolve(`build/${folder}/package.json`), JSON.stringify(packageJson, null, 4))
        }
      },
      terser({
        format: {
          comments: new RegExp(mainPkg.author)
        }
      })
    ]
  }
})
