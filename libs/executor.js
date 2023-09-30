// @ts-check
const executeQuery = require('./executeQuery')
const arrayToObject = require('./arrayToObject')

/**
 * Error catcher function.
 *
 * @callback ErrorCallback
 * @param {Error} error - The error object.
 * @returns {*} The result of error handling.
 */
const catcher = (e) => e(this)

/**
 * Options for query execution.
 *
 * @typedef {object} QueryOptions
 * @property {object} methods - Methods configuration.
 * @property {object} config - Configuration settings.
 */

/**
 * Executes a query and converts the result to an object.
 *
 * @param {object} query - The query to execute.
 * @param {QueryOptions} opts - Options for query execution.
 * @returns {Promise<object>} A promise that resolves to the result object.
 */
const rq = (query, opts) => {
  try {
    return executeQuery(query, null, opts).then(arrayToObject)
  } catch (error) {
    return catcher.bind(error)
  }
}

global.rq = rq
exports.rq = rq
module.exports = rq
module.exports.default = rq

