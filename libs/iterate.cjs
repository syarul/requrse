// @ts-check

const reducer =
  (/** @type {Record<String, any>} */ query, /** @type {number} */ index) =>
  (
    /** @type {Record<String, any>} */ acc,
    /** @type {[string, any]} */ [key, value],
  ) => {
    if (value === 1 && query[key] !== undefined) {
      acc[key] = query[key];
    } else if (value[index] !== undefined) {
      acc[key] = [value[index]];
    } else if (index === parseInt(key, 10)) {
      acc[key] = query;
    }
    return acc;
  };

/**
 * Iterates through result and currentQuery and merge currentQuery properties into result.
 *
 * @param {Array<[string, any]>} result - The base query to iterate through.
 * @param {import("./executeQuery.cjs").CurrentQuery} currentQuery - The query result to iterate through.
 * @returns {Array<[string, any]>} The iterated result.
 */
const iterate = (result, currentQuery) => {
  return (
    currentQuery &&
    currentQuery
      .map((/** @type {object} */ query, /** @type {number} */ i) => {
        query = query instanceof Array ? iterate(result, query) : query;
        if (query instanceof Array) {
          return query;
        }
        if (result.length) {
          const e = Object.entries(result.reduce(reducer(query, i), {}));
          return e.length === 1 ? e.flat() : e;
        } else {
          return query;
        }
      })
      .filter(
        (/** @type {object} */ f) =>
          (f instanceof Array && f.length) || typeof f !== "object",
      )
  );
};

module.exports = iterate;
