// @ts-check

/**
 * Checks if an object is an associative object (not an array) and removes undefined values.
 *
 * @param {Record<string, any>} obj - The object to check.
 * @returns {object | undefined} A new object with undefined values removed.
 */
const chk = (obj) => {
  if (obj instanceof Object && !(obj instanceof Array)) {
    /** @type {Record<string, any>} */
    const newObj = {};
    Object.keys(obj).forEach((key) => {
      if (obj[key] !== undefined) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  }
};

/**
 *
 * @param {*} obj
 * @returns {Boolean}
 */
const isObj = (obj) => !(obj instanceof Array) && typeof obj === "object";

/**
 * Reduces an array of objects into a single object, removing undefined values.
 *
 * @param {any[] | null} arr - The array of objects to reduce.
 * @returns {any} A single object or an array of objects with undefined values removed.
 */
const reducer = (arr) => {
  if (arr instanceof Array && !arr.some((a) => typeof a !== "object")) {
    const obj = arr.reduce(
      (acc, curr) => ({
        ...chk(acc),
        ...chk(curr),
      }),
      {},
    );
    return Object.keys(obj).length ? obj : [];
  }
  return arr;
};

/**
 *
 * @param {*} target
 * @param  {...any} sources
 * @returns
 */
const deepMerge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObj(target) && isObj(source)) {
    for (const key in source) {
      if (isObj(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

/**
 * Combines and prepares arguments for a function call.
 * @this {import("./executeQuery.cjs").MergeQuery}
 * @param {object | undefined} $vParams - Additional parameters.
 * @param {object} params - Main parameters.
 * @param {...object | null} currentQuery - Current query objects.
 * @returns {object[]} An array of arguments for the function call.
 */
const buildArgs = function ($vParams, params, ...currentQuery) {
  /** @type {any[]} */
  const args = currentQuery && [].concat(reducer(currentQuery));
  if ($vParams) {
    args.push($vParams);
    if (args.length === 1) {
      args.push($vParams);
    }
  }
  args.push(params);
  if (isObj(args[0])) {
    args[0] = deepMerge({}, this, args[0], isObj($vParams) ? $vParams : {});
  }
  return args;
};

module.exports = {
  isObj,
  buildArgs,
};
