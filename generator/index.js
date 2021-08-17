module.exports = (api, options = {}, rootOptions = {}) => {
  const isVue3 = (rootOptions.vueVersion === '3')
  const hasTypeScript = api.hasPlugin('typescript')

  if (isVue3) {
    api.injectImports(api.entryFile, `import { createPinia } from 'pinia'`)
    api.transformScript(api.entryFile, require('./injectUseStore'))
    api.extendPackage({
      dependencies: {
        pinia: '^2.0.0-rc.4'
      }
    })
  } else {
    api.injectImports(api.entryFile, `import { createPinia, PiniaPlugin } from 'pinia'`)
    api.injectRootOptions(api.entryFile, `pinia`)
    api.extendPackage({
      dependencies: {
        pinia: '^0.5.4',
        '@vue/composition-api': '^1.1.0'
      }
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
      let piniaLines = `\n\nVue.use(PiniaPlugin)\nconst pinia = createPinia()`
      const lastImportIndex = lines.findIndex(line => line.match(/^import/))
      lines[lastImportIndex] += piniaLines

      // modify app
      contentMain = lines.reverse().join('\n');
      fs.writeFileSync(mainPath, contentMain, { encoding: 'utf-8' })
    })
  }

  if (api.invoking && hasTypeScript) {
    /* eslint-disable-next-line node/no-extraneous-require */
    const convertFiles = require('@vue/cli-plugin-typescript/generator/convert')
    convertFiles(api)
  }
}
