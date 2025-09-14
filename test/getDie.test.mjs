import assert from "assert";
import { RqExtender } from "../libs/executor.cjs";
import { test } from "./fixture/test.mjs";
import gqlToJson from "../libs/gqlToJson.cjs";
import fs from "node:fs";
import cache from "../libs/cache.cjs";
class RandomDie extends RqExtender {
  constructor() {
    super();
  }
  rollOnce(die) {
    return 1 + Math.floor(Math.random() * die.numSides);
  }
  roll(die, { numRolls }) {
    const output = [];
    for (let i = 0; i < numRolls; i++) {
      output.push(this.computes.rollOnce(die));
    }
    return output;
  }
}

const getDie = new RandomDie();

await test("GetDie", () => {
  const query = {
    Query: {
      getDie: {
        $params: {
          numSides: 6,
        },
        numSides: 1,
        rollOnce: 1,
        roll: {
          $params: {
            numRolls: 3,
          },
        },
      },
    },
  };

  getDie.compute(query).then(({ Query }) => {
    assert.strictEqual(typeof Query.getDie.numSides, "number");
    assert.strictEqual(Query.getDie.numSides, 6);

    assert.strictEqual(typeof Query.getDie.rollOnce, "number");
    assert.ok(Query.getDie.rollOnce >= 1 && Query.getDie.rollOnce <= 6);

    assert.ok(Array.isArray(Query.getDie.roll));
    Query.getDie.roll.forEach((num) => {
      assert.ok(num >= 1 && num <= 6);
    });
  });
});

await test("covers all GraphQL literal cases", () => {
  const query = `
    query TestAllLiterals(
      $varInt: Int
      $varFloat: Float
      $varBool: Boolean
      $varString: String
    ) {
      testField(
        intArg: 42
        floatArg: 3.14
        boolArg: true
        stringArg: "hello"
        nullArg: null
        enumArg: RED
        listArg: [1, 2, 3]
        objectArg: { x: 1, y: "yes" }
        varIntArg: $varInt
        varFloatArg: $varFloat
        varBoolArg: $varBool
        varStringArg: $varString
      ) {
        subField
      }
    }
  `;

  const result = gqlToJson(query, "foo");
  // ✅ basic sanity check
  assert.ok(result.foo);
  assert.ok(result.foo.testField);

  // ✅ check args got parsed correctly
  const params = result.foo.testField.$params;
  assert.strictEqual(params.intArg, 42);
  assert.strictEqual(params.floatArg, 3.14);
  assert.strictEqual(params.boolArg, false);
  assert.strictEqual(params.stringArg, "hello");
  assert.strictEqual(params.nullArg, null);
  assert.strictEqual(params.enumArg, "RED");
  assert.deepStrictEqual(params.listArg, [1, 2, 3]);
  assert.deepStrictEqual(params.objectArg, { x: 1, y: "yes" });

  // ✅ check subField presence
  assert.ok(result.foo.testField.subField);
});

await test("GetDie with graphQL query", () => {
  const query = `
    {
      getDie(numSides: 6) {
        numSides
        rollOnce
        roll(numRolls: 3)
      }
    }
  `;

  getDie.compute(query, { rootKey: "Query" }).then(({ Query }) => {
    assert.strictEqual(typeof Query.getDie.numSides, "number");
    assert.strictEqual(Query.getDie.numSides, 6);

    assert.strictEqual(typeof Query.getDie.rollOnce, "number");
    assert.ok(Query.getDie.rollOnce >= 1 && Query.getDie.rollOnce <= 6);

    assert.ok(Array.isArray(Query.getDie.roll));
    Query.getDie.roll.forEach((num) => {
      assert.ok(num >= 1 && num <= 6);
    });
  });
});

// cleanup cache folder first
if (fs.existsSync(".tmp")) {
  fs.rmSync(".tmp", { recursive: true, force: true });
}

await test("GetDie cache", () => {
  const query = `
    {
      getDie(numSides: 6) {
        numSides
        rollOnce
        roll(numRolls: 3)
      }
    }
  `;

  getDie.compute(query, { rootKey: "Query", cache: 5 }).then((res) => {
    getDie.compute(query, { rootKey: "Query", cache: 5 }).then((result) => {
      assert.deepEqual(res, result);
    });
  });
});

await test("GetDie cache expired", async () => {
  const query = `
    {
      getDie(numSides: 6) {
        numSides
        rollOnce
        roll(numRolls: 3)
      }
    }
  `;

  const res = await getDie.compute(query, { rootKey: "Query", cache: 1 });
  const wait = new Promise((resolve) => setTimeout(resolve, 3000));
  await wait;
  const result = await getDie.compute(query, { rootKey: "Query", cache: 1 });
  assert.notDeepEqual(res, result);
});

if (fs.existsSync(".tmp")) {
  fs.rmSync(".tmp", { recursive: true, force: true });
}

await test("cache error create", async () => {
  const origWrite = fs.writeFileSync;
  fs.writeFileSync = () => {
    throw new Error("boom");
  };
  const result = await cache(
    "create",
    { foo: "bar" },
    { cache: 60 },
    { foo: "bar" },
  );
  assert.deepStrictEqual(result, {});
  fs.writeFileSync = origWrite;
});

await test("cache error delete", async () => {
  await cache("create", { foo: "bar" }, { cache: 60 }, { foo: "bar" });
  const origWrite = fs.readFileSync;
  fs.readFileSync = () => {
    throw new Error("boom");
  };

  const result = await cache("get", { foo: "bar" }, { cache: 60 });
  assert.deepStrictEqual(result, undefined);
  fs.readFileSync = origWrite;
});
