'use strict'

const fs = require('fs')
const htmlLooksLike = require('html-looks-like')
const objectPath = require('object-path')
const path = require('path')
const should = require('should')
const helpers = require(path.join(__dirname, '/helpers/index'))

let config = require(path.join(__dirname, '/helpers/config'))
let engine
let factory

describe('Dust.js interface', function () {
  // Get a fresh instance of the engine
  beforeEach(done => {
    config.reset()

    factory = require(helpers.paths.engine)

    engine = {
      extensions: factory.metadata.extensions,
      handle: factory.metadata.handle,
      factory: factory,
      started: false
    }

    done()
  })

  // Get rid of the current instance of the engine
  afterEach(done => {
    delete require.cache[helpers.paths.engine]

    done()
  })

  it('should contain a metadata block with handle and extensions', done => {
    factory.metadata.should.be.Object
    factory.metadata.handle.should.be.String
    factory.metadata.extensions.should.be.Array

    done()
  })

  it('should declare .dust as a supported extension', done => {
    factory.metadata.extensions.indexOf('.dust').should.not.equal(-1)

    done()
  })

  it('should load filters, helpers and partials', done => {
    const Engine = factory()
    const instance = new Engine({
      additionalTemplates: Object.keys(helpers.additionalTemplates).map(name => helpers.additionalTemplates[name]),
      config: config,
      pagesPath: path.join(helpers.paths.workspace, 'pages')
    })

    instance.initialise().then(() => {
      const core = instance.getCore()

      core.filters.up.should.be.Function

      Object.keys(helpers.additionalTemplates).forEach(name => {
        const type = typeof core.cache[name]

        type.should.eql('function')
      })

      done()
    })
  })

  it('should load pages', done => {
    const Engine = factory()
    const instance = new Engine({
      additionalTemplates: Object.keys(helpers.additionalTemplates).map(name => helpers.additionalTemplates[name]),
      config: config,
      pagesPath: path.join(helpers.paths.workspace, 'pages')
    })

    instance.initialise().then(() => {
      return instance.register('products', helpers.pages.products)
    }).then(() => {
      const core = instance.getCore()
      const type = typeof core.cache.products

      type.should.eql('function')

      done()
    })
  })

  it('should render pages with locals', done => {
    const Engine = factory()
    const instance = new Engine({
      additionalTemplates: Object.keys(helpers.additionalTemplates).map(name => helpers.additionalTemplates[name]),
      config: config,
      pagesPath: path.join(helpers.paths.workspace, 'pages')
    })

    const locals = {
      products: [
        {
          name: 'Super Thing 3000',
          price: 5000
        },
        {
          name: 'Mega Thang XL',
          price: 8000
        }
      ]
    }

    const expected = `
      <header>My online store</header>

      <h1>Products:</h1>

      <ul>
        ${locals.products.map(product => {
          return `<li>${product.name} - £${product.price}</li>`
        }).join('\n')}
      </ul>

      <footer>Made by DADI</footer>
    `

    instance.initialise().then(() => {
      return instance.register('products', helpers.pages.products)
    }).then(() => {
      return instance.render('products', helpers.pages.products, locals)
    }).then(output => {
      htmlLooksLike(output, expected)

      done()
    })
  })

  it('should have access to custom dust helpers', done => {
    const Engine = factory()
    const instance = new Engine({
      additionalTemplates: [],
      config: config,
      pagesPath: path.join(helpers.paths.workspace, 'pages')
    })

    const pageContent = '<p>{@Trim data="   space jam        "/}</p>'
    const expected = '<p>space jam</p>'

    instance.initialise().then(() => {
      return instance.register('testHelpers', pageContent)
    }).then(() => {
      return instance.render('testHelpers', pageContent, {})
    }).then(output => {
      htmlLooksLike(output, expected)

      done()
    })
  })

  it('should have access to custom dust filters', done => {
    const Engine = factory()
    const instance = new Engine({
      additionalTemplates: [],
      config: config,
      pagesPath: path.join(helpers.paths.workspace, 'pages')
    })

    const locals = {
      text: 'up in the air'
    }

    const pageContent = '<p>{text|up}</p>'

    const expected = '<p>UP IN THE AIR</p>'

    instance.initialise().then(() => {
      return instance.register('testFilters', pageContent)
    }).then(() => {
      return instance.render('testFilters', pageContent, locals)
    }).then(output => {
      htmlLooksLike(output, expected)

      done()
    })
  })

  it('should still render if custom dust helper cannot be found', done => {
    const Engine = factory()
    const instance = new Engine({
      additionalTemplates: [],
      config: config,
      pagesPath: path.join(helpers.paths.workspace, 'pages')
    })

    const pageContent = `
      <header>Hello!</header>

      {@something}this will be skipped{/something}

      <footer>Bye.</footer>
    `
    const expected = `
      <header>Hello!</header>

      <footer>Bye.</footer>
    `

    instance.initialise().then(() => {
      return instance.register('testMissingHelper', pageContent)
    }).then(() => {
      return instance.render('testMissingHelper', pageContent, {})
    }).then(output => {
      htmlLooksLike(output, expected)

      done()
    })
  })
})
