// @ts-check
const equal = require("deep-equal");
const resolvePromises = require("./resolvePromises.cjs");
const iterate = require("./iterate.cjs");
const computeMethod = require("./computeMethod.cjs");
const getAlias = require("./getAlias.cjs");
const getCurrentQueryArgs = require("./getCurrentQueryArgs.cjs");
const buildArgs = require("./buildArgs.cjs");
const merge = require("./mergeQuery.cjs");
const mapResult = require("./mapResult.cjs");

/**
 * Options for query execution.
 *
 * @typedef {object} QueryOptions
 * @property {object} methods - Methods configuration.
 * @property {object} config - Configuration settings.
 */

/**
 * @typedef ComputeParams
 * @property {CurrentQuery} currentQuery
 * @property {ResultQuery} resultQuery
 * @property {MergeQuery} mergeQuery
 * @property {Boolean | undefined} failedComputed
 */

/**
 *
 * @param {ComputeParams & GeneratedParams} _
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
}) {
  if (currentQuery instanceof Array && !equal(resultQuery, currentQuery)) {
    for (const obj of currentQuery) {
      if ($vParams && !params && !obj[key]) {
        resultQuery.push(compute.apply(mergeQuery, [obj, $vParams]));
      } else {
        resultQuery.push(
          compute.apply(
            mergeQuery,
            buildArgs($vParams, params, { [key]: obj[key] }),
          ),
        );
      }
    }
  } else {
    resultQuery.push(
      compute.apply(mergeQuery, buildArgs($vParams, params, currentQuery)),
    );
  }
  return {
    computed: true,
    currentQuery: resultQuery,
    resultQuery,
  };
}

/**
 *
 * @param {ComputeParams & GeneratedParams} _
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
}) {
  currentQuery = compute.apply(
    mergeQuery,
    buildArgs($vParams, params, ...args),
  );
  if (currentQuery === undefined) {
    failedComputed = true;
  }
  return {
    computed: true,
    failedComputed,
    currentQuery,
    resultQuery,
  };
}

/**
 *
 * @param {ComputeParams & GeneratedParams & QueryOptions} _
 * @returns
 */
function handleOther({ compute, currentQuery, resultQuery, config }) {
  currentQuery = compute;
  // resolve recurrence
  if (typeof currentQuery === "string" && config(currentQuery)) {
    currentQuery = config(currentQuery);
  }
  return {
    computed: false,
    currentQuery,
    resultQuery,
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
 * @param {ReducerOptions & QueryOptions & ValueIsObject} _
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
  return result;
}

/**
 * @typedef Result
 * @property {Promise<CurrentQuery>} currentQuery
 * @property {Boolean | undefined} [computed]
 * @property {Boolean | undefined} [failedComputed]
 */

/**
 *
 * @param {CombineOptions & Result} _
 * @returns
 */
async function getResult({
  value,
  currentQuery,
  methods,
  config,
  mergeQuery,
  query,
  computed,
  failedComputed,
}) {
  const resolvedCurrentQuery = await resolvePromises(currentQuery);
  return value instanceof Object
    ? await valueIsObject({
        value,
        resolvedCurrentQuery,
        methods,
        config,
        mergeQuery,
        query,
        computed,
        failedComputed,
      })
    : typeof resolvedCurrentQuery === typeof value || value === "*"
      ? currentQuery
      : value;
}

/**
 * @typedef CombineQuery
 * @property {CurrentQuery} currentQuery
 * @property {ResultQuery} resultQuery
 * @property {MergeQuery} mergeQuery
 */

/**
 *
 * @param {GeneratedParams & QueryOptions & CombineQuery} _
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

  const match = Object.keys(checks).find((key) => checks[parseInt(key)])

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
  const [key, alias] = getAlias("/", _key);
  const [compute, params] = computeMethod(options, key);
  const [args, $params, $vParams] = getCurrentQueryArgs(
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
 */

/**
 *
 * @param {ResultParams} _
 * @returns
 */
function handleResult({ key, alias, buildEntries, resultQuery, currentQuery }) {
  return (result) => {
    buildEntries.push([alias ? `${key}/${alias}` : key, result]);
    return { buildEntries, resultQuery, currentQuery };
  };
}

/**
 * @typedef ChainReducerOptions
 * @property {String} _key
 * @property {*} value
 */

/** @typedef {ChainReducerOptions & ReducerOptions & QueryOptions} CombineOptions */

/**
 *
 * @param {CombineOptions} options
 * @returns {function}
 */
function chainReducer(options) {
  return ({ buildEntries, resultQuery, currentQuery }) => {
    const params = genParams(currentQuery, options);
    const res = processHandler({
      ...options,
      ...params,
      resultQuery,
      currentQuery,
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
 * @param {ReducerOptions & QueryOptions} options
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
 * @property {QueryOptions} options
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
    Promise.resolve({ buildEntries: [], resultQuery: [], currentQuery }),
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
 * @param {QueryOptions} options - The configuration object with methods and config function.
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
