// @ts-check

/**
 * Checks if an object is an associative object (not an array) and removes undefined values.
 *
 * @param {object} obj - The object to check.
 * @returns {object} A new object with undefined values removed.
 */
const chk = (obj) => {
  if (obj instanceof Object && !(obj instanceof Array)) {
    const newObj = {}
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        newObj[key] = obj[key]
      }
    })
    return newObj
  }
  if (obj instanceof Array && obj.length === 1) {
    return chk(obj[0])
  }
  return obj
}

/**
 * Reduces an array of objects into a single object, removing undefined values.
 *
 * @param {object[]} arr - The array of objects to reduce.
 * @returns {object | object[]} A single object or an array of objects with undefined values removed.
 */
const reducer = (arr) => {
  if (!arr.some(a => typeof a !== 'object')) {
    const obj = arr.reduce((acc, curr) => ({
      ...chk(acc), ...chk(curr)
    }), {})
    return Object.keys(obj).length ? obj : []
  }
  return arr
}

/**
 * Combines and prepares arguments for a function call.
 *
 * @param {object | undefined} $vParams - Additional parameters.
 * @param {object} params - Main parameters.
 * @param {...object} currentQuery - Current query objects.
 * @returns {object[]} An array of arguments for the function call.
 */
module.exports = function ($vParams, params, ...currentQuery) {
  let args = []
  args = args.concat(reducer(currentQuery))
  if ($vParams) {
    args.push($vParams)
  }
  args.push(params)
  return args
}
