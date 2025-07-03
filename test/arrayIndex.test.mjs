import assert from "assert";
import rq from "../libs/executor.cjs";
import { test } from "./fixture/test.mjs";

await test("List Index 0", () => {
  rq(
    {
      Test: {
        list: {
          0: 1,
        },
      },
    },
    {
      methods: {
        list() {
          return [{ foo: "foo" }, { foobar: "foobar" }];
        },
      },
    },
  ).then((result) => {
    assert.deepEqual(result, { Test: { list: { 0: { foo: "foo" } } } });
  });
});

await test("List Index 1", () => {
  rq(
    {
      Test: {
        list: {
          1: 1,
        },
      },
    },
    {
      methods: {
        list() {
          return [{ foo: "foo" }, { foobar: "foobar" }];
        },
      },
    },
  ).then((result) => {
    assert.deepEqual(result, { Test: { list: { 1: { foobar: "foobar" } } } });
  });
});
