// Creates a very basic config object with a `.get()` method,
// similar to the one used by convict. It returns whatever properties
// are passed in as an argument.
module.exports.mockConfig = properties => ({
  get: property => properties[property]
})

module.exports.mockTemplate = () => {
  const Template = function () {

  }

  Template.prototype.register = function (data) {
    console.log('----> data:', data)
    return Promise.resolve(data)
  }

  return Template
}
