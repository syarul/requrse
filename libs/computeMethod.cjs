// @ts-check
const getAlias = require("./getAlias.cjs");

function getParams(parameter) {
  return (
    (typeof parameter === "string" &&
      parameter.length &&
      parameter.split("|")) ||
    parameter
  );
}

/**
 * Gets a compute function and parameters.
 *
 * @param {import("./executeQuery.cjs").CombineOptions} options - The method name or function.
 * @param {string} key - The configuration function.
 * @returns {[function | undefined, string[] | string | undefined]} An array containing the compute function and parameters.
 */
module.exports = (options, key) => {
  const { methods, config } = options;
  const method = methods?.[key];
  let compute;
  let params;
  if (typeof method === "function") {
    compute = method;
  } else if (method) {
    let [m, parameter] = getAlias(",", method);
    params = getParams(parameter);
    compute = config(m);
  }
  return [compute, params];
};
