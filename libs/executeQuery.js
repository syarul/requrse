// @ts-check
const equal = require('deep-equal')
const resolvePromises = require('./resolvePromises')
const iterate = require('./iterate')
const computeMethod = require('./computeMethod')
const getAlias = require('./getAlias')
const getCurrentQueryArgs = require('./getCurrentQueryArgs')
const buildArgs = require('./buildArgs')
const merge = require('./mergeQuery')
const mapResult = require('./mapResult')

/**
 * Options for query execution.
 *
 * @typedef {object} QueryOptions
 * @property {object} methods - Methods configuration.
 * @property {object} config - Configuration settings.
 */

/**
 * Executes a query with the provided configuration.
 *
 * @param {object} query - The query object to execute.
 * @param {object} currentQuery - The current query object.
 * @param {QueryOptions} opts - The configuration object with methods and config function.
 * @param {object} mergeQuery - The mergeQuery object (optional, defaults to an empty object).
 * @returns {Promise<Array<[string, any]>>} A promise that resolves to an array of key-value pairs.
 */
const executeQuery = async (query, currentQuery, opts, mergeQuery = {}) => {
  const { methods, config } = opts
  const entries = Object.entries(query)
  /** @type {any[]} */
  const buildEntries = []
  const resultQuery = []
  let params, alias, compute, args, $params, $vParams, result, computed, failedComputed
  for (let [key, value] of entries) {
    ;[key, alias] = getAlias('/', key)
    mergeQuery.key = mergeQuery.key || key // model cache support
    if (methods[key]) {
      ;[compute, params] = computeMethod(methods[key], params, config)
      ;[args, $params, $vParams] = getCurrentQueryArgs(value, currentQuery, alias, params)
      mergeQuery = merge(mergeQuery, currentQuery)
      if (typeof compute === 'function' && $params.currentQuery && !$params.currentQuery[key]) {
        computed = true
        if (currentQuery instanceof Array && !equal(resultQuery, currentQuery)) {
          for (const obj of currentQuery) {
            if ($vParams && !params && !obj[key]) {
              resultQuery.push(compute.apply(mergeQuery, [obj, $vParams]))
            } else {
              resultQuery.push(compute.apply(mergeQuery, buildArgs($vParams, params, { [key]: obj[key] })))
            }
          }
        } else {
          resultQuery.push(compute.apply(mergeQuery, buildArgs($vParams, params, currentQuery)))
        }
        currentQuery = resultQuery
        if (currentQuery === undefined) { failedComputed = true }
      } else if (typeof compute === 'function') {
        computed = true
        currentQuery = compute.apply(mergeQuery, buildArgs($vParams, params, ...args))
        if (currentQuery === undefined) { failedComputed = true }
      } else {
        currentQuery = compute
        // resolve recurrence
        if (typeof currentQuery === 'string' && config(currentQuery)) {
          const recurrence = config(currentQuery)
          currentQuery = recurrence || currentQuery
        }
      }
    }
    if (alias) {
      key = `${key}/${alias}`
    }
    currentQuery = await resolvePromises(currentQuery)
    if (value instanceof Object) {
      result = await executeQuery(value, currentQuery, { methods, config }, mergeQuery)
      if (currentQuery) {
        if (!(currentQuery instanceof Array) && currentQuery && Object.entries(value) !== result) {
          result = mapResult(query, result, currentQuery)
        } else {
          result = iterate(result, currentQuery)
        }
      }
      const e = Object.entries(value)
      // unresolved value is return as null
      if (computed && failedComputed && result && result[0] && e && e[0] && result[0][0] === e[0][0] && result[0][1] === e[0][1]) {
        result = null
      }
      buildEntries.push([key, result])
    } else {
      // resolved scalar/non-scalar value, and consequently same types
      buildEntries.push([key, typeof currentQuery === typeof value ? currentQuery : value === '*' ? currentQuery : value])
    }
  }
  return buildEntries
}

module.exports = executeQuery
