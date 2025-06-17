import assert from "assert";
import rq from "../libs/executor.cjs";
import { test } from "./fixture/test.mjs";

const foo = {
  id: "0",
  name: "foo",
  after: [1, 2],
};

const bar = {
  id: "1",
  name: "bar",
  after: [2],
};

const ber = {
  id: "2",
  name: "ber",
  after: [],
};

const charData = [foo, bar, ber];

function getChar(id) {
  return Promise.resolve(charData.find((d) => d.id === id.toString()));
}

function getCompleteAfter(chars) {
  return chars.after.map((id) => getChar(id));
}

const config = (param) =>
  ({
    getChar,
    getCompleteAfter,
  })[param] || null;

const methods = {
  char: "getChar",
  afters: "getCompleteAfter",
};

test("Test with array field", async () => {
  rq(
    {
      Test: {
        char: {
          $params: {
            id: 0,
          },
          name: 1,
          afters: {
            id: 1,
            name: 1
          },
        },
      },
    },
    { methods, config },
  ).then((result) => {
    assert.deepEqual(result, {
      Test: {
        char: {
          name: "foo",
          afters: [
            {
              id: "1",
              name: "bar",
            },
            {
              id: "2",
              name: "ber",
            },
          ],
        },
      },
    });
  }, console.error);
});
