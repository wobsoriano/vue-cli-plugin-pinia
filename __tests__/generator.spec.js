/* eslint-disable no-undef */
const generateWithPlugin = require('@vue/cli-test-utils/generateWithPlugin')

test('base', async() => {
  const { files, pkg } = await generateWithPlugin({
    id: 'pinia',
    apply: require('../generator'),
    options: {},
  })

  expect(files['src/store/index.js']).toBeTruthy()
  expect(files['src/store/index.js']).toMatch('import { defineStore }')

  expect(pkg.dependencies).toHaveProperty('pinia')
  expect(pkg.dependencies.pinia).toMatch('^2')
})

test('use with Vue 3', async() => {
  const { files, pkg } = await generateWithPlugin([
    {
      id: '@vue/cli-service',
      apply: require('@vue/cli-service/generator'),
      options: {
        vueVersion: '3',
      },
    },
    {
      id: 'pinia',
      apply: require('../generator'),
      options: {},
    },
  ])

  expect(files['src/store/index.js']).toBeTruthy()
  expect(files['src/store/index.js']).toMatch('import { defineStore }')
  expect(files['src/main.js']).toMatch('import { createPinia }')

  expect(pkg.dependencies).toHaveProperty('pinia')
  expect(pkg.dependencies.pinia).toMatch('^2')
})
