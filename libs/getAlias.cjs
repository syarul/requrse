// @ts-check

/**
 * @typedef KeyAlias
 * @property {String} key
 * @property {String} alias
 */

/**
 * Splits a string using a symbol.
 *
 * @param {string} symbol - The symbol used for splitting.
 * @param {string} key - The string to split.
 * @returns {KeyAlias} An array of substrings.
 */
const getAlias = (symbol, key) => {
  return {
    key: new RegExp(symbol).test(key) ? key.split(symbol)[0] : key,
    alias: new RegExp(symbol).test(key) ? key.split(symbol)[1] : "",
  };
};

module.exports = getAlias;
