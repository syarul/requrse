// @ts-check

/**
 * Maps the result based on query and currentQuery.
 *
 * @param {object} query - The query object.
 * @param {Array<[string, any]>} result - The result to be mapped.
 * @param {object} currentQuery - The current query object.
 * @returns {Array<[string, any]>} The mapped result.
 */
const mapResult = (query, result, currentQuery) => {
  result = result.map(([key, value]) => {
    if (value instanceof Array) {
      return [key, value]
    } else if (currentQuery[key]) {
      return [key, currentQuery[key]]
    }
    const dKeys = Object.entries(query)
    for (const [dK, dV] of dKeys) {
      if (currentQuery[dK] && typeof currentQuery[dK] === 'object') {
        return [key, Object.fromEntries(mapResult(dV, result, currentQuery[dK]))[key]]
      }
      if (currentQuery instanceof Array) {
        return [key, currentQuery.map(q => q?.[dK] || q || null)]
      }
    }
    return [key, null]
  })
  return result
}

module.exports = mapResult
