// @ts-check
const executeQuery = require("./executeQuery.cjs");
const arrayToObject = require("./arrayToObject.cjs");
const dataPath = require("./dataPath.cjs");

/**
 * Options for query execution.
 *
 * @typedef {object} QueryOptions
 * @property {object} methods - Methods configuration.
 * @property {object} config - Configuration settings.
 * @property {string} dataUrl - Data url path.
 */

function postProcessing(options) {
  return (result) => {
    if (options.dataUrl) {
      return dataPath(arrayToObject(result), options.dataUrl);
    }
    return arrayToObject(result);
  };
}

/**
 * Executes a query and converts the result to an object.
 *
 * @param {object} query - The query to execute.
 * @param {QueryOptions} options - Options for query execution.
 * @returns {Promise<object>} A promise that resolves to the result object.
 */
const rq = (query, options) => {
  return executeQuery(query, null, options)
    .then(postProcessing(options))
    .catch((error) => console.error("rql Error:", error.message));
};

global.rq = rq;
exports.rq = rq;
module.exports = rq;
module.exports.default = rq;
