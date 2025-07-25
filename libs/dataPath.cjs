// @ts-check

/**
 * Converts result into data path mapping
 *
 * @param {any} data - The data to map.
 * @returns {any} The final output.
 */
const dataPath = (data, paths = "") => {
  return paths.split("/").reduce((final, path) => final && final[path], data);
};

module.exports = dataPath;
