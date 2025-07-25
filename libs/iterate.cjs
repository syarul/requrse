// @ts-check

/**
 * Iterates through result and currentQuery and merge currentQuery properties into result.
 *
 * @param {Array<[string, any]>} result - The base query to iterate through.
 * @param {object} currentQuery - The query result to iterate through.
 * @returns {Array<[string, any]>} The iterated result.
 */
const iterate = (result, currentQuery) => {
  return currentQuery
    .map((query, i) => {
      query = query instanceof Array ? iterate(result, query) : query;
      if (query instanceof Array) {
        return query;
      }
      const e = Object.entries(
        result.reduce((acc, [key, value]) => {
          if (value === 1 && query[key] !== undefined) {
            acc[key] = query[key];
          } else if (value[i] !== undefined) {
            acc[key] = [value[i]];
          } else if (i === parseInt(key, 10)) {
            acc[key] = query;
          }
          return acc;
        }, {}),
      );
      return e.length === 1 ? e.flat() : e;
    })
    .filter((f) => f.length);
};

module.exports = iterate;
