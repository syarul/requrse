// @ts-check

/**
 * Resolves an array of promises or a single promise.
 *
 * @param {Promise<any> | Promise<any>[]} promise - The promise(s) to resolve.
 * @returns {Promise<any>} A promise that resolves when all input promises are resolved.
 */
const resolvePromises = async (promise) => {
  if (promise instanceof Array) {
    return Promise.all(promise.map(resolvePromises));
  }
  return promise;
};

module.exports = resolvePromises;
