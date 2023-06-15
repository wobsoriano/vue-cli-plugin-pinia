const piniaVersion = '^2.1.4'
const compositionApiVersion = '^1.7.1'

function isNaruto(api) {
  const { semver } = require('@vue/cli-shared-utils')
  const deps = api.generator.pkg.dependencies

  if (deps && deps.vue)
    return semver.gte(semver.coerce(deps.vue), '2.7.0')

  return false
}

module.exports = async (api, _options = {}, rootOptions = {}) => {
  const isVue3 = (rootOptions.vueVersion === '3')
  const isVue2 = (rootOptions.vueVersion === '2')
  const hasTypeScript = api.hasPlugin('typescript')

  if (isVue3) {
    api.injectImports(api.entryFile, 'import { createPinia } from \'pinia\'')
    api.transformScript(api.entryFile, require('./injectUseStore'))
    api.extendPackage({
      dependencies: {
        pinia: piniaVersion,
      },
    })
  }
  else {
    api.injectImports(api.entryFile, 'import { createPinia, PiniaVuePlugin } from \'pinia\'')
    api.injectRootOptions(api.entryFile, 'pinia')
    const dependencies = {
      pinia: piniaVersion,
    }

    if (!api.hasPlugin('@vue/composition-api') && !isNaruto(api)) {
      dependencies['@vue/composition-api'] = compositionApiVersion
      api.injectImports(api.entryFile, 'import VueCompositionAPI from \'@vue/composition-api\'')
      api.exitLog(`Installed @vue/composition-api ${compositionApiVersion}`)
    }

    api.extendPackage({
      dependencies,
    })
  }

  api.render('./template', {})

  api.exitLog(`Installed pinia ${piniaVersion}`)
  api.exitLog('Documentation available at pinia.vuejs.org. For new projects, please use github.com/vuejs/create-vue to scaffold Vite-based projects.')

  if (isVue2) {
    api.onCreateComplete(() => {
      // inject to main.js
      const fs = require('fs')
      const ext = hasTypeScript ? 'ts' : 'js'
      const mainPath = api.resolve(`./src/main.${ext}`)

      // get content
      let contentMain = fs.readFileSync(mainPath, { encoding: 'utf-8' })
      const lines = contentMain.split(/\r?\n/g).reverse()

      // inject import
      let piniaLines = '\n\nVue.use(PiniaVuePlugin)\nconst pinia = createPinia()'
      if (!api.hasPlugin('@vue/composition-api') && !isNaruto(api))
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
