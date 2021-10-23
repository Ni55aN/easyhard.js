import { spawnSync } from 'child_process'
import path from 'path'
import { packages } from './shared/index.mjs'

const reversePackages = [...packages].reverse()

for (const { pkg, folder } of reversePackages) {
  for(const [key] of Object.entries(pkg.peerDependencies || {})) {
    const exists = reversePackages.find(p => p.pkg.name === key)
    const packageBuildFolder = path.resolve(`build/${folder}`)

    if (exists) {
      const npm = spawnSync('npm', ['link', `../${exists.folder}`], { cwd: packageBuildFolder })

      if (npm.error) {
        console.log('Link error', npm.error)
      } else {
        console.log(`Linked ${exists.folder} into ${packageBuildFolder}`)
      }
    }
  }
}
