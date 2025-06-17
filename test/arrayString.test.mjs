import assert from "assert";
import fs from "fs";
import rq from "../libs/executor.cjs";
import { test } from "./fixture/test.mjs";

function getList(id) {
  return Promise.resolve(
    {
      0: {
        header: {
          exec: {
            status: "success",
          },
        },
        listing: [
          { name: "foo", count: 1 },
          { name: "bar", count: 2 },
        ],
      },
    }[id],
  );
}

function getNames({ listing }) {
  return listing.map((p) => p.name);
}

const config = (param) =>
  ({
    getList,
    getNames,
  })[param] || null;

const methods = {
  list: "getList",
  names: "getNames",
};

test("Test with array of string", async () => {
  rq(
    {
      Test: {
        list: {
          $params: {
            id: 0,
          },
          listing: {
            name: 1,
          },
        },
      },
    },
    { methods, config },
  ).then((result) => {
    assert.deepEqual(result, {
      Test: {
        list: {
          listing: {
            name: ["foo", "bar"],
          },
        },
      },
    });
  }, console.error);
});
