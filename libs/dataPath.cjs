// @ts-check

/**
 * Converts result into data path mapping
 *
 * @param {any} data - The data to map.
 * @returns {any} The final output.
 */
const dataPath = (data, paths = '') => {
  return paths.split('/').reduce((final, path) => {
    if (final instanceof Array) {
      return final.map((item) => item[path] || data[path])
    }
    return (final && final[path]) || data[path]
  }, data)
}

module.exports = dataPath
