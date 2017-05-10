const dust = require('dustjs-linkedin')

/*
 * Returns the supplied 'data' parameter trimmed of whitespace on both left and right sides
 * Usage: {@Trim data="{body}"/}
 */
dust.helpers.Trim = function (chunk, context, bodies, params) {
  var data = context.resolve(params.data)
  return chunk.write(data.trim())
}
