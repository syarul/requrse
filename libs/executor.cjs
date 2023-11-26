// @ts-check
const executeQuery = require('./executeQuery.cjs')
const arrayToObject = require('./arrayToObject.cjs')

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
  return executeQuery(query, null, opts)
    .then(arrayToObject)
    .catch(error => console.error('reQurse Error:', error.message))
}

global.rq = rq
exports.rq = rq
module.exports = rq
module.exports.default = rq

