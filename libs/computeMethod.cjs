// @ts-check
const getAlias = require("./getAlias.cjs");

/**
 *
 * @param {import("./getAlias.cjs").KeyAlias} param0
 * @returns
 */
const getParams = ({ alias }) => {
  return (
    (typeof alias === "string" && alias.length && alias.split("|")) || alias
  );
};

/**
 * @typedef ComputeMethod
 * @property {function | undefined} compute
 * @property {string[] | string | undefined} params
 */

/**
 * Gets a compute function and parameters.
 *
 * @param {import("./executeQuery.cjs").CombineOptions} options - The method name or function.
 * @param {string} key - The configuration function.
 * @returns {ComputeMethod} An object containing the compute function and parameters.
 */
const computeMethod = ({ methods, config }, key) => {
  const method = methods?.[key];
  return {
    compute:
      typeof method === "function"
        ? method
        : method
          ? config(getAlias(",", method).key)
          : undefined,
    params:
      typeof method !== "function" && method
        ? getParams(getAlias(",", method))
        : undefined,
  };
};

module.exports = computeMethod;
