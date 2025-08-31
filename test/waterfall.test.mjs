import assert from "assert";
import rq from "../libs/executor.cjs";
import { test } from "./fixture/test.mjs";

await test("Foo Bar", () => {
  rq(
    {
      name: "Test",
      computes: [
        "test", // placeholder
        "foo",
        {
          bar: "*",
        },
      ],
    },
    {
      methods: {
        bar() {
          return "another";
        },
        foo() {
          return {
            bar: "foobar",
          };
        },
      },
    },
  ).then((result) => {
    assert.deepEqual(result, { Test: { test: { foo: { bar: "another" } } } });
  });
});
