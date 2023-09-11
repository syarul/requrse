//@ts-check

/**
 * Splits a string using a symbol.
 *
 * @param {string} symbol - The symbol used for splitting.
 * @param {string} key - The string to split.
 * @returns {string[]} An array of substrings.
 */
module.exports = (symbol, key) => {
  if (new RegExp(symbol).test(key)) {
    return key.split(symbol)
  }
  return [key, '']
}
