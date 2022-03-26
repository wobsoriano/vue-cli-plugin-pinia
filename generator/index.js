module.exports = (api, options = {}, rootOptions = {}) => {
  const isVue3 = (rootOptions.vueVersion === '3')
  const hasTypeScript = api.hasPlugin('typescript')

  if (rootOptions.vueVersion === '3') {
    api.injectImports(api.entryFile, 'import { createPinia } from \'pinia\'')
    api.transformScript(api.entryFile, require('./injectUseStore'))
    api.extendPackage({
      dependencies: {
        pinia: '^2.0.12',
      },
    })
  }
  else {
    api.injectImports(api.entryFile, 'import { createPinia, PiniaPlugin } from \'pinia\'')
    api.injectRootOptions(api.entryFile, 'pinia')
    const dependencies = {
      pinia: '^2.0.12',
    }

    if (!api.hasPlugin('@vue/composition-api')) {
      dependencies['@vue/composition-api'] = '^1.4.0'
      api.injectImports(api.entryFile, 'import VueCompositionAPI from \'@vue/composition-api\'')
    }

    api.extendPackage({
      dependencies,
    })
  }

  api.render('./template', {})

  if (!isVue3) {
    api.onCreateComplete(() => {
      // inject to main.js
      const fs = require('fs')
      const ext = hasTypeScript ? 'ts' : 'js'
      const mainPath = api.resolve(`./src/main.${ext}`)

      // get content
      let contentMain = fs.readFileSync(mainPath, { encoding: 'utf-8' })
      const lines = contentMain.split(/\r?\n/g).reverse()

      // inject import
      let piniaLines = '\n\nVue.use(PiniaPlugin)\nconst pinia = createPinia()'
      if (!api.hasPlugin('@vue/composition-api'))
        piniaLines += '\nVue.use(VueCompositionAPI)'

      const lastImportIndex = lines.findIndex(line => line.match(/^import/))
      lines[lastImportIndex] += piniaLines

      // modify app
      contentMain = lines.reverse().join('\n')
      fs.writeFileSync(mainPath, contentMain, { encoding: 'utf-8' })
    })
  }

  if (api.invoking && hasTypeScript) {
    const convertFiles = require('@vue/cli-plugin-typescript/generator/convert')
    convertFiles(api)
  }
}
