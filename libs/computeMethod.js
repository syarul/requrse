// @ts-check
const getAlias = require('./getAlias')

/**
 * Gets a compute function and parameters.
 *
 * @param {string | function} method - The method name or function.
 * @param {string[] | string | undefined} params - The parameters or undefined.
 * @param {function} config - The configuration function.
 * @returns {[function, string[] | string | undefined]} An array containing the compute function and parameters.
 */
module.exports = (method, params, config) => {
  let m, compute
  if (typeof method === 'function') {
    compute = method
  } else {
    [m, params] = getAlias(',', method)
    params = (typeof params === 'string' && params.length && params.split('|')) || params
    compute = config(m)
  }
  return [compute, params]
}
