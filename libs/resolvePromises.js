// @ts-check

/**
 * Resolves an array of promises or a single promise.
 *
 * @param {Promise<any> | Promise<any>[]} promise - The promise(s) to resolve.
 * @returns {Promise<any>} A promise that resolves when all input promises are resolved.
 */
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
