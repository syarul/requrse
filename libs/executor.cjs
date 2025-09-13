// @ts-check
const executeQuery = require("./executeQuery.cjs");
const arrayToObject = require("./arrayToObject.cjs");
const dataPath = require("./dataPath.cjs");
const gqlToJson = require("./gqlToJson.cjs");

/**
 * Using waterfall structure for better readability
 * @param {*} query
 * @param {QueryOptions} options
 * @returns
 */
function parser(query, options) {
  if (typeof query === "string") {
    // assume it graphQL query
    return gqlToJson(query, options.rootKey);
  }
  if (query.name && Array.isArray(query.computes)) {
    const result = {};
    const current = result;

    query.computes.reduce((acc, item) => {
      if (typeof item === "string") {
        acc[item] = {};
        return acc[item];
      } else if (typeof item === "object" && item !== null) {
        Object.assign(acc, item);
        return acc;
      }
    }, current);

    return {
      [query.name]: result,
    };
  } else {
    return query;
  }
}

/**
 * Options for query execution.
 *
 * @typedef {object} QueryOptions
 * @property {object} methods - Methods configuration.
 * @property {object} [config] - Optional, configuration settings.
 * @property {string} [dataUrl] - Optional, data url path.
 * @property {string} [rootKey] - Optional, graphQL root key name of Query if using graphQL query payload instead of JSON.
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
  const parseQuery = parser(query, options);
  return executeQuery(parseQuery, null, options).then(postProcessing(options));
};

class RqExtender {
  constructor() {
    this.methods = {};
  }
  compute(query, options) {
    if (Object.keys(this.methods).length) {
      return rq(query, {
        methods: this.methods,
        config: (param) => this.getMethodsMap()[param],
        ...options,
      });
    } else {
      return rq(query, {
        methods: this.getMethodsMap(),
        ...options,
      });
    }
  }

  getMethodsMap() {
    const prototype = Object.getPrototypeOf(this);
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) =>
        typeof this[name] === "function" &&
        name !== "constructor" &&
        name !== "compute" &&
        name !== "getMethodsMap",
    );
    const methodsMap = {};
    for (const name of methodNames) {
      methodsMap[name] = this[name]; // use rq context { query, computes }
    }
    return methodsMap;
  }
}

global.rq = rq;
exports.rq = rq;
module.exports = rq;
module.exports.default = rq;

global.RqExtender = RqExtender;
exports.RqExtender = RqExtender;
module.exports.RqExtender = RqExtender;
