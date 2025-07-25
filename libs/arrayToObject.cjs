// @ts-check
const checkEntry = require("./checkEntry.cjs");

/**
 *
 * @param {*} arr
 * @returns {Boolean}
 */
const checkUniq = (arr) => {
  const check = arr.map((i) => i && i?.[0]).filter((f) => f !== undefined);
  return check.length === [...new Set(check)].length;
};

/**
 *
 * @param {Boolean} unique
 * @returns
 */
const reducer = (unique) => {
  return (acc, item) => {
    if (item && item[0]) {
      if (unique) {
        acc[item[0]] = arrayToObject(item[1]);
      } else {
        acc.push({ [item[0]]: arrayToObject(item[1]) });
      }
    }
    return acc;
  };
};

/**
 * Converts an array into an object recursively.
 *
 * @param {any[]} arr - The array to convert.
 * @returns {object | object[]} An object or an array with converted values.
 */
const arrayToObject = (arr) => {
  if (Array.isArray(arr) && !checkEntry(arr)) {
    if (arr.length === 1 && Array.isArray(arr[0])) {
      return arrayToObject(arr.flat());
    }
    return arr.map(arrayToObject);
  }
  if (checkEntry(arr)) {
    const unique = checkUniq(arr);
    return arr.reduce(reducer(unique), unique ? {} : []);
  }
  return arr;
};

module.exports = arrayToObject;
