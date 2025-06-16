// @ts-check
const executeQuery = require('./executeQuery.cjs')
const arrayToObject = require('./arrayToObject.cjs')
const dataPath = require('./dataPath.cjs')

/**
 * Options for query execution.
 *
 * @typedef {object} QueryOptions
 * @property {object} methods - Methods configuration.
 * @property {object} config - Configuration settings.
 * @property {string} dataUrl - Data url path.
 */

/**
 * Executes a query and converts the result to an object.
 *
 * @param {object} query - The query to execute.
 * @param {QueryOptions} opts - Options for query execution.
 * @returns {Promise<object>} A promise that resolves to the result object.
 */
const rq = (query, opts) => {
  return executeQuery(query, null, opts)
    .then(res => {
      if (opts.dataUrl) {
        return dataPath(arrayToObject(res), opts.dataUrl)
      }
      return arrayToObject(res)
    })
    .catch(error => console.error('reQurse Error:', error.message))
}

global.rq = rq
exports.rq = rq
module.exports = rq
module.exports.default = rq
