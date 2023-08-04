const resolvePromises = async (promise) => {
  let res
  if (promise instanceof Array) {
    res = await Promise.all(promise.map(resolvePromises))
  } else {
    res = await promise
  }
  return res
}

module.exports = resolvePromises
