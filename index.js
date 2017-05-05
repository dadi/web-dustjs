const ENGINE = {
  extensions: ['.dust'],
  handle: 'dust'
}

module.exports = () => {
  const fs = require('fs')
  const path = require('path')

  const debug = require('debug')('web:templates:dust')
  const wildcard = require('wildcard')

  let dust

  const EngineDust = function (options) {
    debug('Starting Dust.js engine...')

    this.additionalTemplates = options.additionalTemplates
    this.config = options.config
    this.helpers = options.helpers
    this.pagesPath = options.pagesPath
    this.templates = options.templates

    dust = options.module ? options.module : require('dustjs-linkedin')
  }

  /**
    * Loads Dust partials from all directories in `this.partialsDirectories`.
    *
    * @return {Promise} The names of the partials loaded.
    */
  EngineDust.prototype._loadPartials = function () {
    return this.helpers.readFiles(this.additionalTemplates, {
      callback: file => {
        return new Promise((resolve, reject) => {
          fs.readFile(file, 'utf8', (err, data) => {
            if (err) return reject(err)

            const extension = path.extname(file)
            const templateName = path.relative(this.pagesPath, file)
              .slice(0, -extension.length)

            this.register(templateName, data)

            resolve(templateName)
          })
        })
      }
    })
  }

  /**
    * Requires all JS files within a directory.
    *
    * @param {string} directory The full path to the directory.
    */
  EngineDust.prototype._requireDirectory = function (directory) {
    return this.helpers
      .readDirectory(directory, {
        extensions: ['.js'],
        recursive: true
      })
      .then(files => {
        files.forEach(file => {
          require(path.resolve(file))
        })

        return files
      })
  }

  /**
    * Callback to be fired after all templates finish loading.
    */
  EngineDust.prototype.finishLoading = function () {
    return this.writeClientsideFiles()
  }

  /**
    * Returns the engine core module.
    *
    * @return {function} The engine core module.
    */
  EngineDust.prototype.getCore = function () {
    return dust
  }

  /**
    * Returns information about the engine.
    *
    * @return {object} An object containing the engine name and version.
    */
  EngineDust.prototype.getInfo = function () {
    return {
      engine: ENGINE.handle,
      version: dust.version
    }
  }

  /**
    * Initialises the engine.
    *
    * @return {Promise} A Promise that resolves when the engine is fully loaded.
    */
  EngineDust.prototype.initialise = function () {
    const paths = this.config.get('dust.paths')

    // Apply config settings
    dust.isDebug = this.config.get('dust.debug')
    dust.debugLevel = this.config.get('dust.debugLevel')
    dust.config.cache = this.config.get('dust.cache')
    dust.config.whitespace = this.config.get('dust.whitespace')

    const filtersPath = path.resolve(paths.filters)
    const helpersPath = path.resolve(paths.helpers)

    return this._requireDirectory(filtersPath)
      .then(filters => {
        debug('filters loaded %o', filters)

        return this._requireDirectory(helpersPath)
      })
      .then(helpers => {
        debug('helpers loaded %o', helpers)

        return this._loadPartials()
      })
      .then(partials => {
        debug('partials loaded %o', partials)
      })
  }

  /**
    * Registers the template with markup.
    *
    * @return {Promise} A Promise that resolves with the loaded data.
    */
  EngineDust.prototype.register = function (name, data) {
    delete dust.cache[name]

    const compiledData = dust.compile(data, name)

    dust.loadSource(compiledData)

    return true
  }

  /**
    * Renders a template.
    *
    * @param {string} data The template content.
    * @param {object} locals The variables to add to the context.
    * @param {object} options Additional render options.
    *
    * @return {Promise} A Promise that resolves with the render result.
    */
  EngineDust.prototype.render = function (name, data, locals, options) {
    locals = locals || {}
    options = options || {}

    if (options.keepWhitespace) {
      dust.config.whitespace = typeof options.keepWhitespace !== 'undefined'
        ? options.keepWhitespace
        : true
    }

    return new Promise((resolve, reject) => {
      dust.render(name, locals, (err, output) => {
        if (err) return reject(err)

        resolve(output)
      })
    })
  }

  /**
    * Writes templates to client-side JS files.
    */
  EngineDust.prototype.writeClientsideFiles = function () {
    let queue = []
    let templates = Object.keys(dust.cache)

    if (!this.config.get('dust.clientRender.enabled')) {
      return Promise.resolve(true)
    }

    if (this.config.get('dust.clientRender.whitelist').length > 0) {
      const whitelist = this.config.get('dust.clientRender.whitelist')

      templates = templates.filter(templateName => {
        let match = false

        whitelist.forEach(item => {
          match = match || wildcard(item, templateName)
        })

        return match
      })
    }

    // Write templates
    if (this.config.get('dust.clientRender.format') === 'combined') {
      const templatesOutputFile = path.join(
        this.config.get('paths.public'),
        this.config.get('dust.clientRender.path')
      )
      let templatesOutput = ''

      templates.forEach(name => {
        templatesOutput += dust.cache[name]
      })

      queue.push(
        this.helpers
          .writeToFile(templatesOutputFile, templatesOutput)
          .then(() => templates)
      )
    } else {
      templates.forEach(name => {
        const templatesOutputFile =
          path.join(
            this.config.get('paths.public'),
            this.config.get('dust.clientRender.path'),
            name
          ) + '.js'

        queue.push(
          this.helpers
            .writeToFile(templatesOutputFile, dust.cache[name])
            .then(() => name)
        )
      })
    }

    return Promise.all(queue).then(templates => {
      debug('wrote templates to client-side: %o', templates)
    })
  }

  return EngineDust
}

module.exports.extensions = ENGINE.extensions
module.exports.handle = ENGINE.handle
