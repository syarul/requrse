import assert from "assert";
import fs from "fs";
import rq from "../libs/executor.cjs";
import { test } from "./fixture/test.mjs";

const file = "./test/data.json";

fs.writeFileSync(
  file,
  JSON.stringify({
    author: {
      name: "J.K. Rowling",
      country: "United Kingdom",
    },
  }),
);

const config = (param) =>
  ({
    foo: () => 5,
    bar: 2,
    ber: 1,
    person: {
      name: "John",
      age: 15,
    },
    occupation: {
      job: "Copywriter",
      company: "New York Post",
    },
    recurrentPerson: "person",
    data: () => JSON.parse(fs.readFileSync("./test/data.json")),
    updateData(current, next, $params) {
      let newData = $params
        .map((key) => ({ ...current[key], ...next[key] }))
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});
      newData = Object.fromEntries($params.map((p) => [p, newData]));
      fs.writeFileSync(file, JSON.stringify(newData));
      return newData;
    },
    addedAge(current, $params) {
      $params.forEach((key) => {
        if (current[key]) {
          current[key]++;
        }
      });
      return current;
    },
  })[param] || null;

const methods = {
  hello() {
    return [{ a: "x" }];
  },
  foo: "foo",
  bar: "bar",
  ber: "ber",
  person: "person",
  recurrentPerson: "recurrentPerson",
  data: "data",
  updateData: "updateData,author",
  occupation: "occupation",
  addedAge: "addedAge,age",
};

await test("Test hello a", () =>
  rq(
    {
      Test: {
        test: {
          hello: {
            a: 1,
          },
        },
      },
    },
    { methods, config },
  ).then((result) => {
    assert.deepEqual(result, {
      Test: {
        test: {
          hello: { a: "x" },
        },
      },
    });
  }));

await test("Test foo 5", () =>
  rq(
    {
      Test: {
        test: {
          foo: 1,
        },
      },
    },
    { methods, config },
  ).then((result) => {
    assert.deepEqual(result, {
      Test: {
        test: {
          foo: 5,
        },
      },
    });
  }));

await test("Test bar 2", () =>
  rq(
    {
      Test: {
        test: {
          bar: 1,
        },
      },
    },
    { methods, config },
  ).then((result) => {
    assert.deepEqual(result, {
      Test: {
        test: {
          bar: 2,
        },
      },
    });
  }));

await test("Test ber 1", () =>
  rq(
    {
      Test: {
        test: {
          ber: 1,
        },
      },
    },
    { methods, config },
  ).then((result) => {
    assert.deepEqual(result, {
      Test: {
        test: {
          ber: 1,
        },
      },
    });
  }, console.error));

await test("Test deep query", () =>
  rq(
    {
      Test: {
        test: {
          person: {
            name: 1,
            occupation: {
              job: 1,
            },
          },
        },
      },
    },
    { methods, config },
  ).then((result) => {
    assert.deepEqual(result, {
      Test: {
        test: {
          person: {
            name: "John",
            occupation: {
              job: "Copywriter",
            },
          },
        },
      },
    });
  }));

await test("Test non-scalar query", () =>
  rq(
    {
      Test: {
        test: {
          person: "*",
        },
      },
    },
    { methods, config },
  ).then((result) => {
    assert.deepEqual(result, {
      Test: {
        test: {
          person: {
            name: "John",
            age: 15,
          },
        },
      },
    });
  }));

await test("Test recurrence query", () =>
  rq(
    {
      Test: {
        test: {
          recurrentPerson: "*",
        },
      },
    },
    { methods, config },
  ).then((result) => {
    assert.deepEqual(result, {
      Test: {
        test: {
          recurrentPerson: {
            name: "John",
            age: 15,
          },
        },
      },
    });
  }));

await test("Test data immutability", () =>
  rq(
    {
      Test: {
        test: {
          data: "*",
          updateData: {
            $params: {
              author: {
                books: [
                  "Harry Potter and the Philosopher's Stone",
                  "Harry Potter and the Chamber of Secrets",
                ],
              },
            },
            author: 1,
          },
        },
      },
    },
    { methods, config },
  ).then((result) => {
    assert.deepEqual(result, {
      Test: {
        test: {
          data: {
            author: {
              name: "J.K. Rowling",
              country: "United Kingdom",
            },
          },
          updateData: {
            author: {
              name: "J.K. Rowling",
              country: "United Kingdom",
              books: [
                "Harry Potter and the Philosopher's Stone",
                "Harry Potter and the Chamber of Secrets",
              ],
            },
          },
        },
      },
    });
  }));

await test("Test data immutability operation", () =>
  rq(
    {
      Test: {
        test: {
          person: {
            age: 1,
            addedAge: {
              age: 1,
            },
          },
        },
      },
    },
    { methods, config },
  ).then((result) => {
    assert.deepEqual(result, {
      Test: {
        test: {
          person: {
            age: 15,
            addedAge: {
              age: 16,
            },
          },
        },
      },
    });
  }));
