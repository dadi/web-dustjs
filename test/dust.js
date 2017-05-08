const fs = require('fs')
const htmlLooksLike = require('html-looks-like')
const path = require('path')
const should = require('should')
const helpers = require(path.join(__dirname, '/helpers'))

const config = helpers.mockConfig({
  'dust.paths': {
    filters: 'test/workspace/filters',
    helpers: 'test/workspace/helpers'
  }
})

let engine
let factory
let productsTemplate

const PATHS = {
  engine: path.join(__dirname, '/../index'),
  workspace: path.join(__dirname, '/workspace')
}

const ADDITIONAL_TEMPLATES = {
  'partials/footer': path.join(PATHS.workspace, 'pages/partials/footer.dust'),
  'partials/header': path.join(PATHS.workspace, 'pages/partials/header.dust')
}

const PAGES = {
  products: fs.readFileSync(path.join(PATHS.workspace, 'pages/products.dust'), 'utf8')
}

describe('Dust.js interface', function () {
  // Get a fresh instance of the engine
  beforeEach(done => {
    factory = require(PATHS.engine)

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
    delete require.cache[PATHS.engine]

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
      additionalTemplates: Object.keys(ADDITIONAL_TEMPLATES).map(name => ADDITIONAL_TEMPLATES[name]),
      config: config,
      pagesPath: path.join(PATHS.workspace, 'pages')
    })

    instance.initialise().then(() => {
      const core = instance.getCore()

      core.filters.foo.should.be.Function

      Object.keys(ADDITIONAL_TEMPLATES).forEach(name => {
        const type = typeof core.cache[name]

        type.should.eql('function')
      })

      done()
    })
  })

  it('should load pages', done => {
    const Engine = factory()
    const instance = new Engine({
      additionalTemplates: Object.keys(ADDITIONAL_TEMPLATES).map(name => ADDITIONAL_TEMPLATES[name]),
      config: config,
      pagesPath: path.join(PATHS.workspace, 'pages')
    })

    instance.initialise().then(() => {
      return instance.register('products', PAGES.products)
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
      additionalTemplates: Object.keys(ADDITIONAL_TEMPLATES).map(name => ADDITIONAL_TEMPLATES[name]),
      config: config,
      pagesPath: path.join(PATHS.workspace, 'pages')
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
      return instance.register('products', PAGES.products)
    }).then(() => {
      return instance.render('products', PAGES.products, locals)
    }).then(output => {
      htmlLooksLike(output, expected)

      done()
    }).catch(e => console.log(e))
  })
})
