import typescript from 'rollup-plugin-typescript2';
import { eslint } from 'rollup-plugin-eslint';
import fromEntries from 'fromentries';
import fs from 'fs-extra';
import path from 'path';

const mainPkg = require('./package.json')
const packages = ['core', 'common', 'styles', 'router', 'loader', 'api', 'client', 'server'].map(folder => ({
  folder,
  pkg: require(`./packages/${folder}/package.json`)
}))

export default packages.map(({ folder, pkg }) => {
  return {
    input: `packages/${folder}/src/index.ts`,
    external: Object.keys(pkg.dependencies || {}),
    output: ['cjs', 'esm'].map(format => {
      return {
        file: `build/${folder}/${format}.js`,
        format,
        exports: 'auto'
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
      }
    ]
  }
})
