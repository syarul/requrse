const equal = require('deep-equal')
const resolvePromises = require('./resolvePromises')
const iterate = require('./iterate')
const computeMethod = require('./computeMethod')
const getAlias = require('./getAlias')
const getCurrentQueryArgs = require('./getCurrentQueryArgs')
const buildArgs = require('./buildArgs')
const merge = require('./mergeQuery')

const executeQuery = async (query, currentQuery, { methods, config }, mergeQuery = {}) => {
  const [entries, buildEntries, resultQuery] = [Object.entries(query), [], []]
  let params, alias, compute, args, $params, $vParams, result, computed, failedComputed
  for (let [key, value] of entries) {
    ;[key, alias] = getAlias('/', key)
    if (methods[key]) {
      ;[compute, params] = computeMethod(compute, methods[key], params, config)
      ;[args, $params, $vParams] = getCurrentQueryArgs(value, currentQuery, alias, params)
      mergeQuery = merge(mergeQuery, currentQuery)
      if (typeof compute === 'function' && $params.currentQuery && !$params.currentQuery[key]) {
        computed = true
        if (currentQuery instanceof Array && !equal(resultQuery, currentQuery)) {
          for (const obj of currentQuery) {
            resultQuery.push(compute.apply(mergeQuery, buildArgs($vParams, params, { [key]: obj[key] })))
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
    if (value instanceof Object) {
      currentQuery = await resolvePromises(currentQuery)
      result = await executeQuery(value, currentQuery, { methods, config }, mergeQuery)
      if (currentQuery) {
        if (!(currentQuery instanceof Array)) {
          if (!currentQuery && Object.entries(value) === result) {
            result = null
          } else {
            result = result.map(([key, value]) => {
              if (value instanceof Array) {
                return [key, value]
              } else if ((currentQuery || {})[key]) {
                return [key, (currentQuery || {})[key]]
              }
              return null
            })
          }
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