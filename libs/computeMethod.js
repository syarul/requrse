const getAlias = require('./getAlias')

module.exports = (compute, method, params, config) => {
  let m
  if (typeof method === 'function') {
    compute = method
  } else {
    [m, params] = getAlias(',', method)
    params = (typeof params === 'string' && params.length && params.split('|')) || params
    compute = config(m)
  }
  return [compute, params]
}
