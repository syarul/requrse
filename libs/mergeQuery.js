//@ts-check

/**
 * Merges two query objects.
 *
 * @param {object} query - The original query object.
 * @param {object | object[]} nextQuery - The query object(s) to merge with the original.
 * @returns {object} The merged query object.
 */
const mergeQuery = (query, nextQuery) => {
  if (Array.isArray(nextQuery)) {
    let obj = {}
    nextQuery.forEach(q => {
      if (!Array.isArray(q) && typeof q === 'object') {
        obj = {
          ...obj,
          ...q
        }
      } else {
        obj = {
          ...obj,
          ...(mergeQuery(query, q))
        }
      }
    })
    return mergeQuery(query, obj)
  } else {
    return {
      ...query,
      ...nextQuery
    }
  }
}

module.exports = mergeQuery
