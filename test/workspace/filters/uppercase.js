var dust = require('dustjs-linkedin')

dust.filters.up = function (value) {
  return value.toUpperCase()
}