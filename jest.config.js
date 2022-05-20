const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

const getConfig = (args) => ({
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFiles: ['core-js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/*/src/**/*.ts'
  ],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  modulePathIgnorePatterns: ['build'],
  ...args
})


module.exports = {
  projects: [
    {
      ...getConfig({
        testMatch: [
          '<rootDir>/packages/**/*.test.ts'
        ]
      })
    },
    {
      ...getConfig({
        testMatch: [
          '<rootDir>/test/**/*.test.ts'
        ]
      })
    }
  ]
}
