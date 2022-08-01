import typescript from 'rollup-plugin-typescript2';
import { eslint } from 'rollup-plugin-eslint';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import fromEntries from 'fromentries';
import fs from 'fs-extra';
import path from 'path';
import { mainPkg, packages } from './scripts/shared/index.mjs'

const isDev = process.env.MODE === 'dev'
const destination = process.env.DEST || 'build'

const getBanner = (pkg) => `/*!
 * ${pkg.name} v${pkg.version}
 * (c) 2019-${new Date().getFullYear()} ${mainPkg.author}
 * Released under the ${mainPkg.license} license.
 */`

export default packages.map(({ folder, pkg }) => {
  const inputs = pkg.rollup?.inputs || ['index']

  return inputs.map(input => ({
    input: `packages/${folder}/src/${input}.ts`,
    external: Object.keys(pkg.dependencies || {}),
    output: ['cjs', 'esm'].map(format => {
      return {
        file: `${destination}/${pkg.name}/${input === 'index' ? format : [input, format].join('.')}.js`,
        format,
        exports: 'auto',
        sourcemap: true,
        banner: isDev ? undefined : getBanner(pkg)
      }
    }),
    external: ['rxjs', 'rxjs/operators', 'recast', 'cookie', 'easyhard', 'easyhard-common', 'easyhard-bridge', 'easyhard-alias', 'easyhard-common-alias', 'rxjs-alias',/* TODO */],
    plugins: [
      pkg.rollup?.node ? (
        nodeResolve({
          preferBuiltins: true
        })
      ) : null,
      eslint(),
      isDev ? undefined : terser({
        format: {
          comments: new RegExp(mainPkg.author)
        }
      }),
      typescript({
        tsconfig: `packages/${folder}/tsconfig.json`,
        useTsconfigDeclarationDir: false,
 		    tsconfigOverride: {
          compilerOptions: {
            sourceMap: true,
            declaration: true,
            declarationDir: path.resolve(`${destination}/${pkg.name}/types`),
            baseUrl: '.',
            paths: fromEntries(packages.map(({ folder, pkg }) => [pkg.name, [`../../${destination}/${pkg.name}`]]))
          }
         }
      }),
      {
        name: 'pkg',
        async buildEnd() {
          const { repository, author, license, bugs, homepage } = mainPkg
          const packageJson = {
            ...pkg,
            ...(inputs.length > 1 ? {} : {
              main: 'cjs',
              module: 'esm',
            }),
            repository, author, license, bugs, homepage
          }

          fs.mkdirSync(`${destination}/${pkg.name}`, { recursive: true })
          fs.copyFileSync(path.resolve(`packages/${folder}/package-lock.json`), path.resolve(`${destination}/${pkg.name}/package-lock.json`))
          fs.writeFileSync(path.resolve(`${destination}/${pkg.name}/package.json`), JSON.stringify(packageJson, null, 4))
        }
      }
    ]
  }))
}).flat()
