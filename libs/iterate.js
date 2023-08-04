const iterate = (result, currentQuery) => {
  return currentQuery.map((query, i) => {
    const res = {}
    query = query instanceof Array ? iterate(result, query) : query
    if (query instanceof Array) {
      return query
    }
    result.forEach(([key, value]) => {
      if (value === 1 && query[key] !== undefined) {
        res[key] = query[key]
      } else if (value === '*') {
        res[key] = query
      } else if (value[i] !== undefined) {
        res[key] = [value[i]]
      }
    })
    const e = Object.entries(res)
    if (e.length === 1) { return e.flat() }
    return e
  }).filter(f => f.length)
}

module.exports = iterate
