// @ts-check

/**
 * Checks if a value is an array of arrays with a specific structure.
 *
 * @param {any} v - The value to check.
 * @returns {boolean} true if the value matches the expected structure, false otherwise.
 */
module.exports = (v) =>
  Array.isArray(v) &&
  Array.isArray(v[0]) &&
  v[0].length === 2 &&
  typeof v[0][0] === "string";
