// @ts-check
const executeQuery = require("./executeQuery.cjs");
const arrayToObject = require("./arrayToObject.cjs");
const dataPath = require("./dataPath.cjs");
const gqlToJson = require("./gqlToJson.cjs");
const copy = require("copy-props");
const cache = require("./cache.cjs");

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

    query.computes.reduce(
      (
        /** @type {{ [x: string]: any; }} */ acc,
        /** @type {string | number | null} */ item,
      ) => {
        if (typeof item === "string") {
          acc[item] = {};
          return acc[item];
        } else if (typeof item === "object" && item !== null) {
          Object.assign(acc, item);
          return acc;
        }
      },
      current,
    );

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
 * @property {Record<string, any>} methods - Methods configuration.
 * @property {Function} [config] - Optional, configuration settings.
 * @property {string} [dataUrl] - Optional, data url path.
 * @property {string} [rootKey] - Optional, graphQL root key name of Query if using graphQL query payload instead of JSON.
 * @property {number} [cache] - how long the cache lives in seconds
 * @property {string} [cacheDir] - Optional, custom caching directory default is '.tmp'.
 */

/**
 *
 * @param {QueryOptions} options
 * @returns
 */
function postProcessing(options) {
  /** @param {import("./executeQuery.cjs").BuildEntries} result */
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
  const cached = cache("get", parseQuery, options);
  if (cached) {
    return cached;
  }
  return executeQuery(copy(parseQuery, {}), null, options).then((result) => {
    const processed = postProcessing(options)(result);
    if (options.cache) {
      cache("create", parseQuery, options, processed);
    }
    return processed;
  });
};

/** @typedef {{ [key: string]: Function | any }} Method */

class RqExtender {
  constructor() {
    this.methods = {};
  }
  /**
   *
   * @param {object} query
   * @param {QueryOptions} options
   * @returns
   */
  compute(query, options) {
    if (Object.keys(this.methods).length) {
      return rq(query, {
        ...options,
        methods: this.methods,
        /** @param {string} param */
        config: (param) => this.getMethodsMap()[param],
      });
    } else {
      return rq(query, {
        ...options,
        methods: this.getMethodsMap(),
      });
    }
  }

  /**
   * @this {Method}
   * @returns {Method}
   */
  getMethodsMap() {
    const prototype = Object.getPrototypeOf(this);
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) =>
        typeof this[name] === "function" &&
        name !== "constructor" &&
        name !== "compute" &&
        name !== "getMethodsMap",
    );
    /** @type {Method} */
    const methodsMap = {};
    for (const name of methodNames) {
      methodsMap[name] = this[name]; // use rq context { query, computes }
    }
    return methodsMap;
  }
}

/** @type {any} */
(global).rq = rq;
exports.rq = rq;
module.exports = rq;
module.exports.default = rq;
/** @type {any} */
(global).RqExtender = RqExtender;
exports.RqExtender = RqExtender;
module.exports.RqExtender = RqExtender;
