// @ts-check

function queryReducer(acc, ql) {
  return (query) => {
    return {
      ...acc,
      ...(!Array.isArray(ql) && typeof ql === "object"
        ? ql
        : mergeQuery(query, ql)),
    };
  };
}

/**
 * Merges two query objects.
 *
 * @param {object} query - The original query object.
 * @param {object | object[]} nextQuery - The query object(s) to merge with the original.
 * @returns {object} The merged query object.
 */
const mergeQuery = (query, nextQuery) => {
  if (Array.isArray(nextQuery)) {
    return mergeQuery(query, nextQuery.reduce(queryReducer(query), {}));
  } else {
    return {
      ...query,
      ...nextQuery,
    };
  }
};

module.exports = mergeQuery;
