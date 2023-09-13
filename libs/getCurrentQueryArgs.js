// @ts-check

/**
 * Prepares arguments and parameters.
 *
 * @param {object} value - The value to process.
 * @param {object | null} currentQuery - The current query object.
 * @param {string | undefined} alias - Indicates whether an alias is used.
 * @param {string[] | string | undefined} params - An array of parameter names.
 * @returns {[object[], object, object]} An array containing arguments, currentQuery, and vParams.
 */
module.exports = (value, currentQuery, alias, params) => {
  const vParams = value.$params
  const $params = currentQuery && !alias ? { currentQuery } : vParams || value
  delete value.$params
  let args = Object.entries($params).map(p => p[1])
  if (params && params instanceof Array) {
    args = params.map(p => ({ [p]: $params[p] }))
  }
  return [args, $params, vParams]
}
