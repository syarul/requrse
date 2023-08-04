module.exports = (value, currentQuery, alias, params) => {
  const vParams = value.$params
  const $params = currentQuery && !alias ? { currentQuery } : vParams || value
  delete value.$params
  let args = Object.entries($params).map(p => p[1])
  if (params && params.length) {
    args = params.map(p => ({ [p]: $params[p] }))
  }
  return [args, $params, vParams]
}
