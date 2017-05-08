var dust = require('dustjs-linkedin')

function foo (value) {
  return value
}

dust.filters.foo = foo