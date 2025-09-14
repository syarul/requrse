const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Generates a hash for the given parsed query object.
 * @param {object} parseQuery
 * @returns {string}
 */
function getHash(parseQuery) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(parseQuery))
    .digest("hex");
}

/**
 * Handles caching for parsed queries.
 * @param {'create' | 'get'} action
 * @param {object} parseQuery
 * @param {import("./executor.cjs").QueryOptions} options
 * @param {*} [processed]
 * @returns {Promise<object>|undefined}
 */
function cache(action, parseQuery, options, processed) {
  if (!options.cache) return;

  const hash = getHash(parseQuery);
  const tmpDir = options.cacheDir || path.join(__dirname, "../.tmp");
  const tmpFile = path.join(tmpDir, `${hash}.tmp`);
  const tmpFileExpiry = path.join(tmpDir, `${hash}.expire.tmp`);

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  if (action === "create" && processed !== undefined) {
    try {
      fs.writeFileSync(tmpFile, JSON.stringify(processed), "utf8");
      fs.writeFileSync(
        tmpFileExpiry,
        `${Math.floor(Date.now() / 1000)}`,
        "utf8",
      );
    } catch {}
    return Promise.resolve({});
  }

  if (fs.existsSync(tmpFileExpiry)) {
    try {
      const expiryTime = parseInt(fs.readFileSync(tmpFileExpiry, "utf8"), 10);
      if (Math.floor(Date.now() / 1000) - expiryTime > options.cache) {
        fs.unlinkSync(tmpFileExpiry);
        if (fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile);
        }
      }
    } catch {}
  }

  if (fs.existsSync(tmpFileExpiry) && fs.existsSync(tmpFile)) {
    try {
      const cached = fs.readFileSync(tmpFile, "utf8");
      return Promise.resolve(JSON.parse(cached));
    } catch {}
  }
}

module.exports = cache;
