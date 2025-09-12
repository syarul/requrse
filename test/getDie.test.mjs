import assert from "assert";
import { RqExtender } from "../libs/executor.cjs";
import { test } from "./fixture/test.mjs";

await test("GetDie", () => {
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

  const payload = {
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

  getDie.compute(payload).then(({ Query }) => {
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
