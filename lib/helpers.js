'use strict'

const fs = require('fs')
const log = require('@dadi/logger')
const mkdirp = require('mkdirp')
const path = require('path')

/**
  * Lists all files in a directory.
  *
  * @param {string} directory Full directory path.
  * @param {object} options
  * @param {array} options.extensions A list of extensions to filter files by.
  * @param {boolean} options.failIfNotFound Whether to throw an error if the directory doesn't exist.
  * @param {boolean} options.recursive Whether to read sub-directories.
  *
  * @return {array} A list of full paths to the discovered files.
  */
function readDirectory (directory, options) {
  options = options || {}

  const extensions = options.extensions
  const failIfNotFound = options.failIfNotFound
  const recursive = options.recursive

  let matchingFiles = []
  let queue = []

  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        if (err.code === 'ENOENT' && failIfNotFound) {
          return reject(err)
        }

        return resolve([])
      }

      files.forEach(file => {
        const absolutePath = path.join(directory, file)
        const stats = fs.statSync(absolutePath)
        const isValidExtension =
          !extensions || extensions.indexOf(path.extname(file)) !== -1

        if (stats.isFile() && isValidExtension) {
          matchingFiles.push(absolutePath)
        } else if (stats.isDirectory() && recursive) {
          queue.push(
            readDirectory(absolutePath, {
              extensions: extensions,
              recursive: true
            }).then(childFiles => {
              matchingFiles = matchingFiles.concat(childFiles)
            })
          )
        }
      })

      Promise.all(queue).then(() => {
        resolve(matchingFiles)
      })
    })
  })
}

module.exports.readDirectory = readDirectory

/**
  * Executes a callback for each file on a list of paths.
  *
  * @param {array} files The file paths.
  * @param {object} options
  * @param {function} options.callback The callback to be executed.
  * @param {array} options.extensions A list of extensions to filter files by.
  *
  * @return {array} A Promise that resolves after all callbacks have executed.
  */
function readFiles (files, options) {
  options = options || {}

  const callback = options.callback
  const extensions = options.extensions

  if (typeof callback !== 'function') {
    return Promise.resolve([])
  }

  return new Promise((resolve, reject) => {
    let queue = []

    files.forEach(file => {
      const extension = path.extname(file)

      if (extensions && extensions.indexOf(extension) === -1) {
        return
      }

      const stats = fs.statSync(file)

      if (!stats.isFile()) return

      queue.push(callback(file))
    })

    resolve(Promise.all(queue))
  })
}

module.exports.readFiles = readFiles

/**
  * Writes a string to a file, creating any directories necessary.
  *
  * @param {string} filePath The full path to the file.
  * @param {string} content The content to be written.
  * @param {boolean} append Whether to append to a file if it already exists.
  *
  * @return {Promise} A Promise that resolves with the content written.
  */
function writeToFile (filePath, content, append) {
  return new Promise((resolve, reject) => {
    mkdirp(path.dirname(filePath), (err, made) => {
      if (err) {
        log.error(
          { module: 'templates' },
          { err: err },
          "Error creating directory for file '%s'",
          filePath
        )

        return reject(err)
      }

      const writeFunction = append ? fs.appendFile : fs.writeFile

      writeFunction.call(this, filePath, content, err => {
        if (err) {
          log.error(
            { module: 'templates' },
            { err: err },
            "Error writing to file '%s'",
            filePath
          )

          return reject(err)
        }

        resolve(content)
      })
    })
  })
}

module.exports.writeToFile = writeToFile
