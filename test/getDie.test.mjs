import assert from "assert";
import { RqExtender } from "../libs/executor.cjs";
import { test } from "./fixture/test.mjs";
import gqlToJson from "../libs/gqlToJson.cjs";
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
      output.push(1 + Math.floor(Math.random() * die.numSides));
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

  // pass the name of the query in options
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
