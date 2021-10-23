import typescript from 'rollup-plugin-typescript2';
import { eslint } from 'rollup-plugin-eslint';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import fromEntries from 'fromentries';
import fs from 'fs-extra';
import path from 'path';
import { mainPkg, packages } from './scripts/shared/index.mjs'

const isDev = process.env.MODE === 'dev'

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
        sourcemap: true,
        banner: isDev ? undefined : getBanner(pkg)
      }
    }),
    external: ['rxjs', 'rxjs/operators', 'recast', 'cookie', 'easyhard', 'easyhard-common', 'easyhard-bridge'],
    plugins: [
      pkg.rollup?.node ? (
        nodeResolve({
          preferBuiltins: true
        })
      ) : null,
      eslint(),
      typescript({
        tsconfig: `packages/${folder}/tsconfig.json`,
        useTsconfigDeclarationDir: false,
 		    tsconfigOverride: {
          compilerOptions: {
            sourceMap: true,
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
      isDev ? undefined : terser({
        format: {
          comments: new RegExp(mainPkg.author)
        }
      })
    ]
  }
})
