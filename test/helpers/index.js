'use strict'

const fs = require('fs')
const path = require('path')

const PATHS = {
  engine: path.join(__dirname, '/../../index'),
  workspace: path.join(__dirname, '/../workspace')
}

const ADDITIONAL_TEMPLATES = {
  'partials/footer': path.join(PATHS.workspace, 'pages/partials/footer.dust'),
  'partials/header': path.join(PATHS.workspace, 'pages/partials/header.dust')
}

const PAGES = {
  products: fs.readFileSync(path.join(PATHS.workspace, 'pages/products.dust'), 'utf8')
}

module.exports.additionalTemplates = ADDITIONAL_TEMPLATES
module.exports.pages = PAGES
module.exports.paths = PATHS
