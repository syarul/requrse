const mapResult = (query, result, currentQuery) => {
  result = result.map(([key, value]) => {
    if (value instanceof Array) {
      return [key, value]
    } else if ((currentQuery || {})[key]) {
      return [key, (currentQuery || {})[key]]
    }
    const dKeys = Object.entries(query)
    for (const [dK, dV] of dKeys) {
      if (currentQuery[dK] && typeof currentQuery[dK] === 'object') {
        return [key, Object.fromEntries(mapResult(dV, result, currentQuery[dK]))[key]]
      }
    }
    return null
  })
  return result
}

module.exports = mapResult
