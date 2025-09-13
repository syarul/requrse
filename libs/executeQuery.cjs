// @ts-check
const equal = require("deep-equal");
const resolvePromises = require("./resolvePromises.cjs");
const iterate = require("./iterate.cjs");
const computeMethod = require("./computeMethod.cjs");
const getAlias = require("./getAlias.cjs");
const getCurrentQueryArgs = require("./getCurrentQueryArgs.cjs");
const { buildArgs, isObj } = require("./buildArgs.cjs");
const merge = require("./mergeQuery.cjs");
const mapResult = require("./mapResult.cjs");

/**
 * @typedef ComputeParams
 * @property {CurrentQuery} currentQuery
 * @property {ResultQuery} resultQuery
 * @property {MergeQuery} mergeQuery
 * @property {Boolean | undefined} failedComputed
 */

/**
 *
 * @param {ComputeParams & GeneratedParams & import("./executor.cjs").QueryOptions} _
 * @returns
 */
function handleComputeParams({
  compute,
  currentQuery,
  resultQuery,
  mergeQuery,
  $vParams,
  params,
  key,
  config,
  methods,
}) {
  if (currentQuery instanceof Array && !equal(resultQuery, currentQuery)) {
    for (const obj of currentQuery) {
      if ($vParams && !params && !obj[key]) {
        try {
          resultQuery.push(
            compute.apply(
              {
                query: mergeQuery,
                computes: config || methods,
              },
              [obj, $vParams],
            ),
          );
        } catch (err) {
          throw err;
        }
      } else {
        try {
          resultQuery.push(
            compute.apply(
              {
                query: mergeQuery,
                computes: config || methods,
              },
              buildArgs.apply(mergeQuery, [
                $vParams,
                params,
                { [key]: obj[key] },
              ]),
            ),
          );
        } catch (err) {
          throw err;
        }
      }
    }
  } else {
    try {
      resultQuery = [
        compute.apply(
          {
            query: mergeQuery,
            computes: config || methods,
          },
          buildArgs.apply(mergeQuery, [$vParams, params, currentQuery]),
        ),
      ];
    } catch (err) {
      throw err;
    }
  }
  return {
    computed: true,
    currentQuery: resultQuery,
    resultQuery,
    mergeQuery,
  };
}

/**
 *
 * @param {ComputeParams & GeneratedParams & import("./executor.cjs").QueryOptions} _
 * @returns
 */
function handleCompute({
  compute,
  currentQuery,
  resultQuery,
  mergeQuery,
  $vParams,
  params,
  failedComputed,
  args,
  config,
  methods,
}) {
  try {
    currentQuery = compute.apply(
      {
        query: mergeQuery,
        computes: config || methods,
      },
      buildArgs.apply(mergeQuery, [$vParams, params, ...args]),
    );
  } catch (err) {
    throw err;
  }
  if (currentQuery === undefined) {
    failedComputed = true;
  }
  // look for computed field
  if (isObj(currentQuery)) {
    for (const key in currentQuery) {
      compute =
        (typeof config === "function" && config(key)) ||
        methods?.[key] ||
        compute;
      if (methods?.[key] && compute && typeof compute === "function") {
        try {
          currentQuery[key] = compute.apply(
            {
              query: mergeQuery,
              computes: config || methods,
            },
            buildArgs.apply(mergeQuery, [$vParams, params, ...args]),
          );
        } catch (err) {
          throw err;
        }
      }
    }
  }
  return {
    computed: true,
    failedComputed,
    currentQuery,
    resultQuery,
    mergeQuery,
  };
}

/**
 *
 * @param {ComputeParams & GeneratedParams & import("./executor.cjs").QueryOptions} _
 * @returns
 */
function handleOther({
  compute,
  currentQuery,
  resultQuery,
  mergeQuery,
  config,
  $vParams,
  params,
}) {
  currentQuery = compute;
  // resolve recurrence
  if (typeof currentQuery === "string" && config(currentQuery)) {
    currentQuery = config(currentQuery);
  }
  if (!currentQuery && $vParams) {
    currentQuery = $vParams;
  }
  return {
    computed: false,
    currentQuery,
    resultQuery,
    mergeQuery,
  };
}

/**
 * @typedef ValueIsObject
 * @property {*} value
 * @property {CurrentQuery} resolvedCurrentQuery
 * @property {Boolean | undefined} [computed]
 * @property {Boolean | undefined} [failedComputed]
 */

/**
 *
 * @param {ReducerOptions & import("./executor.cjs").QueryOptions & ValueIsObject} _
 * @returns
 */
async function valueIsObject({
  value,
  resolvedCurrentQuery,
  methods,
  config,
  mergeQuery,
  query,
  computed,
  failedComputed,
}) {
  /** @type {*} */
  let result = await executeQuery(
    value,
    resolvedCurrentQuery,
    { methods, config },
    mergeQuery,
  );
  if (resolvedCurrentQuery) {
    if (
      !(resolvedCurrentQuery instanceof Array) &&
      resolvedCurrentQuery &&
      Object.entries(value) !== result
    ) {
      result = mapResult(query, result, resolvedCurrentQuery);
    } else {
      result = iterate(result, resolvedCurrentQuery);
    }
  }
  const e = Object.entries(value);
  // unresolved value is return as null
  if (
    computed &&
    failedComputed &&
    result &&
    result[0] &&
    e &&
    e[0] &&
    result[0][0] === e[0][0] &&
    result[0][1] === e[0][1]
  ) {
    result = null;
  }
  return { res: result, mergeQuery };
}

/**
 * @typedef Result
 * @property {Promise<CurrentQuery>} currentQuery
 * @property {ResultQuery} resultQuery
 * @property {Boolean | undefined} [computed]
 * @property {Boolean | undefined} [failedComputed]
 */

/**
 * @typedef QueryResult
 * @property {*} res
 * @property {MergeQuery} mergeQuery
 */

/**
 *
 * @param {CombineOptions & Result} _
 * @returns {Promise<QueryResult>}
 */
async function getResult({
  value,
  currentQuery,
  resultQuery,
  methods,
  config,
  mergeQuery,
  query,
  computed,
  failedComputed,
}) {
  const resolvedCurrentQuery = await resolvePromises(currentQuery);
  let res;
  if (value instanceof Object) {
    return valueIsObject({
      value,
      resolvedCurrentQuery,
      methods,
      config,
      mergeQuery,
      query,
      computed,
      failedComputed,
    });
  } else if (typeof resolvedCurrentQuery === typeof value || value === "*") {
    res = currentQuery;
  } else if (
    resultQuery instanceof Array &&
    resultQuery.length === 1 &&
    typeof resultQuery[0] !== "object"
  ) {
    res = resultQuery[0];
  } else {
    res = value;
  }
  return { res, mergeQuery };
}

/**
 * @typedef CombineQuery
 * @property {CurrentQuery} currentQuery
 * @property {ResultQuery} resultQuery
 * @property {MergeQuery} mergeQuery
 */

/**
 *
 * @param {GeneratedParams & import("./executor.cjs").QueryOptions & CombineQuery} _
 * @returns
 */
const processHandler = ({
  key,
  compute,
  $params,
  currentQuery,
  resultQuery,
  mergeQuery,
  $vParams,
  params,
  args,
  config,
  methods,
}) => {
  mergeQuery.key = mergeQuery?.key || key; // model cache support
  mergeQuery = merge(mergeQuery, currentQuery);
  const checks = {
    0:
      typeof compute === "function" &&
      $params.currentQuery &&
      !$params.currentQuery[key],
    1: typeof compute === "function",
  };
  const handlers = {
    0: handleComputeParams,
    1: handleCompute,
  };

  const match = Object.keys(checks).find((key) => checks[parseInt(key)]);

  return (handlers?.[match] || handleOther)({
    compute,
    currentQuery,
    resultQuery,
    mergeQuery,
    $vParams,
    params,
    key,
    args,
    config,
    methods,
  });
};

/**
 * @typedef GeneratedParams
 * @property {*} key
 * @property {*} alias
 * @property {*} compute
 * @property {*} params
 * @property {*} args
 * @property {*} $params
 * @property {*} $vParams
 */

/**
 *
 * @param {CurrentQuery} currentQuery
 * @param {CombineOptions} options
 * @returns {GeneratedParams}
 */
function genParams(currentQuery, options) {
  const { _key, value } = options;
  const { key, alias } = getAlias("/", _key);
  const { compute, params } = computeMethod(options, key);
  const { args, $params, $vParams } = getCurrentQueryArgs(
    value,
    currentQuery,
    alias,
    params,
  );
  return {
    key,
    alias,
    compute,
    params,
    args,
    $params,
    $vParams,
  };
}

/** @typedef {Record<string, any>} ResultQuery */

/**
 * @typedef ResultParams
 * @property {String} key
 * @property {String} alias
 * @property {BuildEntries} buildEntries
 * @property {ResultQuery} resultQuery
 * @property {CurrentQuery} currentQuery
 * @property {MergeQuery} mergeQuery
 */

/**
 *
 * @param {ResultParams} _
 * @returns
 */
function handleResult({
  key,
  alias,
  buildEntries,
  resultQuery,
  currentQuery,
  mergeQuery,
}) {
  /** @param {QueryResult} result */
  return (result) => {
    buildEntries.push([alias ? `${key}/${alias}` : key, result.res]);
    return {
      buildEntries,
      resultQuery,
      currentQuery,
      mergeQuery: { ...mergeQuery, ...result.mergeQuery },
    };
  };
}

/**
 * @typedef ChainReducerOptions
 * @property {String} _key
 * @property {*} value
 */

/** @typedef {ChainReducerOptions & ReducerOptions & import("./executor.cjs").QueryOptions} CombineOptions */

/**
 *
 * @param {CombineOptions} options
 * @returns {function}
 */
function chainReducer(options) {
  return ({ buildEntries, resultQuery, currentQuery, mergeQuery }) => {
    const params = genParams(currentQuery, options);
    const res = processHandler({
      ...options,
      ...params,
      resultQuery,
      currentQuery,
      mergeQuery,
    });
    currentQuery = res?.currentQuery || currentQuery;
    return getResult({
      ...options,
      ...res,
      currentQuery,
    }).then(
      handleResult({
        buildEntries,
        resultQuery: res.resultQuery,
        currentQuery,
        mergeQuery,
        ...params,
      }),
    );
  };
}

/**
 * @typedef ReducerOptions
 * @property {Query} query
 * @property {MergeQuery} mergeQuery
 */

/**
 *
 * @param {ReducerOptions & import("./executor.cjs").QueryOptions} options
 * @returns
 */
function entryReducer(options) {
  return (promiseChain, [_key, value]) =>
    promiseChain.then(
      chainReducer({
        _key,
        value,
        ...options,
      }),
    );
}

/**
 * @typedef EntriesParams
 * @property {Query} query
 * @property {CurrentQuery} currentQuery
 * @property {MergeQuery} mergeQuery
 * @property {import("./executor.cjs").QueryOptions} options
 */

/**
 *
 * @param {EntriesParams} _
 * @returns
 */
const handleEntries = ({ query, currentQuery, mergeQuery, options }) =>
  Object.entries(query).reduce(
    entryReducer({
      query,
      mergeQuery,
      ...options,
    }),
    Promise.resolve({
      buildEntries: [],
      resultQuery: [],
      currentQuery,
      mergeQuery,
    }),
  );

/** @typedef {Record<string, any>} Query */
/** @typedef {Record<string, any> | null} CurrentQuery */
/** @typedef {Record<string, any>} MergeQuery */
/** @typedef {any[]} BuildEntries */

/**
 * Executes a query with the provided configuration.
 *
 * @param {Query} query - The query object to execute.
 * @param {CurrentQuery} currentQuery - The current query object.
 * @param {import("./executor.cjs").QueryOptions} options - The configuration object with methods and config function.
 * @param {MergeQuery} mergeQuery - The mergeQuery object (optional, defaults to an empty object).
 * @returns {Promise<BuildEntries>} A promise that resolves to an array of key-value pairs.
 */
const executeQuery = async (query, currentQuery, options, mergeQuery = {}) =>
  handleEntries({
    query,
    currentQuery,
    mergeQuery,
    options,
  }).then(({ buildEntries }) => buildEntries);

module.exports = executeQuery;
