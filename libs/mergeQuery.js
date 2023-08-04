const mergeQuery = (query, nextQuery) => {
  if (Array.isArray(nextQuery)) {
    let obj = {}
    nextQuery.forEach(q => {
      if (!Array.isArray(q) && typeof q === 'object') {
        obj = {
          ...obj,
          ...q
        }
      } else {
        obj = {
          ...obj,
          ...(mergeQuery(query, q))
        }
      }
    })
    return mergeQuery(query, obj)
  } else {
    return {
      ...query,
      ...nextQuery
    }
  }
}

module.exports = mergeQuery
