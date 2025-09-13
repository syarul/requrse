import assert from "assert";
import { RqExtender } from "../libs/executor.cjs";
import { test } from "./fixture/test.mjs";

await test("Classes config", () => {
  class TestConfig extends RqExtender {
    constructor() {
      super();
      this.methods = {
        area: "area",
        occupation: "occupation",
        person: "getPerson",
        birth: "birth",
      };
    }
    area() {
      return { city: "NY" };
    }
    occupation() {
      return { type: "CT0" };
    }
    birth() {
      return { year: "1981" };
    }
    getPerson(name) {
      return { name, age: 42 };
    }
  }

  const test = new TestConfig();

  const payload = {
    Test: {
      test: {
        person: {
          $params: { name: "Foo" },
          name: 1,
          age: 1,
          birth: {
            year: 1,
            area: {
              city: 1,
            },
          },
          occupation: {
            type: 1,
          },
        },
      },
    },
  };

  test.compute(payload).then((result) => {
    assert.deepEqual(result, {
      Test: {
        test: {
          person: {
            name: "Foo",
            age: 42,
            birth: { year: "1981", area: { city: "NY" } },
            occupation: { type: "CT0" },
          },
        },
      },
    });
  });
});

await test("Classes config fail area", () => {
  class TestConfig extends RqExtender {
    constructor() {
      super();
      this.methods = {
        area: "area",
        occupation: "occupation",
        person: "getPerson",
        birth: "birth",
      };
    }
    area() {
      throw new Error("Unable to find area");
    }
    occupation() {
      return { type: "CT0" };
    }
    birth() {
      return { year: "1981" };
    }
    getPerson(name) {
      return { name, age: 42 };
    }
  }

  const test = new TestConfig();

  const payload = {
    Test: {
      test: {
        person: {
          $params: { name: "Foo" },
          name: 1,
          age: 1,
          birth: {
            year: 1,
            area: {
              city: 1,
            },
          },
          occupation: {
            type: 1,
          },
        },
      },
    },
  };

  test.compute(payload).catch((error) => {
    assert.equal(error.message, "Unable to find area");
  });
});
