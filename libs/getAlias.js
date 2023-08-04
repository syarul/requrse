module.exports = (symbol, key) => {
  if (new RegExp(symbol).test(key)) {
    return key.split(symbol)
  }
  return [key, undefined]
}
