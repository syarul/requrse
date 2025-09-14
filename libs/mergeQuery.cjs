// @ts-check

const queryReducer = (
  /** @type {object} */ acc,
  /** @type {import("./executeQuery.cjs").CurrentQuery} */ ql,
) => {
  return (/** @type {Query} */ query) => {
    return {
      ...acc,
      ...mergeQuery(query, ql),
    };
  };
};

/** @typedef {object} Query */

/**
 * Merges two query objects.
 *
 * @param {Query} query - The original query object.
 * @param {import("./executeQuery.cjs").CurrentQuery} nextQuery - The query object(s) to merge with the original.
 * @returns {object} The merged query object.
 */
const mergeQuery = (query, nextQuery) => {
  if (Array.isArray(nextQuery)) {
    return mergeQuery(query, nextQuery.reduce(queryReducer(query, {}), {}));
  } else {
    return {
      ...query,
      ...nextQuery,
    };
  }
};

module.exports = mergeQuery;
