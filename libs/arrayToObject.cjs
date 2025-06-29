// @ts-check
const checkEntry = require("./checkEntry.cjs");

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
    let obj;
    const checkUniq = arr
      .map((i) => {
        return i && i instanceof Object ? i[0] : undefined;
      })
      .filter((f) => f !== undefined);
    const unique = checkUniq.length === [...new Set(checkUniq)].length;
    arr.forEach((item) => {
      if (item && item[0]) {
        if (unique) {
          obj = obj || {};
          obj[item[0]] = arrayToObject(item[1]);
        } else {
          obj = obj || [];
          obj.push({ [item[0]]: arrayToObject(item[1]) });
        }
      }
    });
    return obj;
  }
  return arr;
};

module.exports = arrayToObject;
