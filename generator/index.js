module.exports = (api, options = {}, rootOptions = {}) => {
  api.injectImports(api.entryFile, `import { createPinia } from 'pinia'`)

  if (rootOptions.vueVersion === '3') {
    api.transformScript(api.entryFile, require('./injectUseStore'))
    api.extendPackage({
      dependencies: {
        pinia: 'next'
      }
    })
    api.render('./template-vue3', {})
  } else {
    api.injectRootOptions(api.entryFile, `store`)
    api.extendPackage({
      dependencies: {
        pinia: 'latest',
        '@vue/composition-api': '^1.1.0'
      }
    })
    api.render('./template', {})
  }

  if (api.invoking && api.hasPlugin('typescript')) {
    /* eslint-disable-next-line node/no-extraneous-require */
    const convertFiles = require('@vue/cli-plugin-typescript/generator/convert')
    convertFiles(api)
  }
}
