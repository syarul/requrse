// @ts-check

/**
 * @typedef CurrentArgs
 * @property {Record<any, string>[]} args
 * @property {*} $params previous iteration with fallback to $vParams and value
 * @property {*} $vParams virtual parameters
 */

/**
 * Prepares arguments and parameters.
 *
 * @param {Record<string, any>} value - The value to process.
 * @param {object | null} currentQuery - The current query object.
 * @param {string | undefined} alias - Indicates whether an alias is used.
 * @param {string[] | string | undefined} params - An array of parameter names.
 * @returns {CurrentArgs} An array containing arguments, currentQuery, and vParams.
 */
const getCurrentQueryArgs = (value, currentQuery, alias, params) => {
  const $vParams = value.$params;
  const $params = currentQuery && !alias ? { currentQuery } : $vParams || value;
  // remove $params field
  delete value.$params;
  return {
    args:
      params && params instanceof Array
        ? params.map((p) => ({ [p]: $params[p] }))
        : Object.entries($params).map((p) => p[1]),
    $params,
    $vParams,
  };
};

module.exports = getCurrentQueryArgs;
