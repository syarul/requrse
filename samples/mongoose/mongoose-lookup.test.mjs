import assert from "assert";
import mongoose from "mongoose";
import requrseMongoose from "./mongoose.middleware.mjs";
import { test as testFixture } from "../../test/fixture/test.mjs";

mongoose.Promise = global.Promise;

mongoose.connect("mongodb://localhost:27017/requrse").catch((error) => {
  console.log(error);
  process.exit(1);
});

const test = async (result, expected, msg = "") => {
  await testFixture(msg, () => assert.deepEqual(result, expected));
};

/**
 * This is a sample showcase how to do lookup query, instead using mongodb/mongoose
 * lookup method, we can simply write a find method with extra arguments, the previous
 * query result is stored as context which we can retrieved and assign as parameters
 * for the next lookup
 */
const countries = [
  {
    country_code: "US",
    country_name: "USA",
    population: 331000000,
  },
  {
    country_code: "CA",
    country_name: "Canada",
    population: 38000000,
  },
];

const cities = [
  {
    city_name: "Washington D.C.",
    country_code: "US",
    population: 700000,
  },
  {
    city_name: "Ottawa",
    country_code: "CA",
    population: 1000000,
  },
];

const data = [countries, cities];

const modelOptions = [
  {
    name: "Country",
    fields: {
      country_name: { type: String, unique: true },
      country_code: String,
      population: Number,
    },
  },
  {
    name: "City",
    fields: {
      city_name: { type: String, unique: true },
      country_code: String,
      population: Number,
    },
  },
];

const fields = (model) =>
  Object.entries(model.fields)
    .map(([key]) => ({ [key]: 1 }))
    .reduce((a, b) => ({ ...a, ...b }));

async function save(model, data) {
  return Promise.all(
    data.map(async (d) =>
      requrseMongoose(
        {
          [model.name]: {
            create: {
              $params: {
                data: d,
              },
              ...fields(model),
            },
          },
        },
        [model],
      ),
    ),
  );
}

let index = 0;
for (const model of modelOptions) {
  await save(model, data[index]);
  index++;
}

function lookup(query) {
  return requrseMongoose({
    Country: {
      find: {
        $params: {
          query,
        },
        country_name: 1,
        population: 1,
        lookup: {
          // generic method that don't exist as entry of the previous query
          $params: {
            name: "City",
            country_code: 1,
          },
          city_name: 1,
          population: 1,
        },
      },
    },
  });
}

await lookup({ country_code: "US" }).then((result) => {
  test(
    result,
    {
      Country: {
        find: {
          country_name: "USA",
          population: 331000000,
          lookup: {
            city_name: "Washington D.C.",
            population: 700000,
          },
        },
      },
    },
    "Should return result with lookup table",
  );
}, console.error);

await lookup({ country_code: "CA" }).then((result) => {
  test(
    result,
    {
      Country: {
        find: {
          country_name: "Canada",
          population: 38000000,
          lookup: {
            city_name: "Ottawa",
            population: 1000000,
          },
        },
      },
    },
    "Should return result with lookup table",
  );
}, console.error);

async function deleteModel(model) {
  await requrseMongoose({
    [model.name]: {
      delete: {
        acknowledged: 1,
        deletedCount: 1,
      },
    },
  }).then((result) => {
    test(
      result,
      {
        [model.name]: {
          delete: {
            acknowledged: true,
            deletedCount: 2,
          },
        },
      },
      "Should cleanup after",
    );
  });
}

for (const model of modelOptions) {
  await deleteModel(model);
}

mongoose.disconnect();
