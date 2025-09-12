// @ts-check
const executeQuery = require("./executeQuery.cjs");
const arrayToObject = require("./arrayToObject.cjs");
const dataPath = require("./dataPath.cjs");

/**
 * Using waterfall structure for better readability
 * @param {*} query
 * @returns
 */
function waterfallParser(query) {
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
 * @property {object} [config] - Configuration settings.
 * @property {string} [dataUrl] - Data url path.
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
  const parseQuery = waterfallParser(query);
  return executeQuery(parseQuery, null, options)
    .then(postProcessing(options))
    .catch((error) => console.error("rql Error:", error));
};

class RqExtender {
  constructor() {
    this.methods = {};
  }
  compute(payload) {
    if (Object.keys(this.methods).length) {
      return rq(payload, {
        methods: this.methods,
        config: (param) => this.getMethodsMap()[param],
      });
    } else {
      return rq(payload, {
        methods: this.getMethodsMap(),
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
      methodsMap[name] = this[name].bind(this);
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
