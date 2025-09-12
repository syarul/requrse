import assert from "assert";
import mongoose from "mongoose";
import requrseMongoose from "./mongoose.middleware.mjs";
import { test as testFixture } from "../../test/fixture/test.mjs";

mongoose.Promise = global.Promise;

mongoose.connect("mongodb://localhost:27017/requrse").catch((error) => {
  console.log(error);
  process.exit(1);
});

let arg;
const test = async function (msg, run) {
  try {
    arg = await testFixture(msg, run, arg);
  } catch (e) {
    console.error(e);
  }
};

const modelOptions = {
  name: "Book",
  fields: {
    title: { type: String, unique: true },
    genre: String,
  },
};

/* const query1 = {
  Book: {
    find: {
      _id: 1,
      title: 1,
      genre: 1,
    }
  }
}

const query2 = {
  Book: {
    create: {
      $params: {
        data: {
          title: 'Harry Potter and the Sorcerer\'s Stone',
          genre: 'Fantasy'
        }
      },
      title: 1
    }
  }
}

await requrseMongoose(query1, modelOptions).then(console.log) */

await test("Should give us undisputable result of a book with title: Harry Potter and the Sorcerer's Stone", async function () {
  const query = {
    Book: {
      create: {
        $params: {
          data: {
            title: "Harry Potter and the Sorcerer's Stone",
            genre: "Fantasy",
          },
        },
        title: 1,
      },
    },
  };
  const result = await requrseMongoose(query, modelOptions);
  assert.deepEqual(result, {
    Book: {
      create: {
        title: "Harry Potter and the Sorcerer's Stone",
      },
    },
  });
});

await test("Should give us undisputable result of a new book with title: Harry Potter and the Prisoner of Azkaban", async function () {
  const query = {
    Book: {
      find: {
        _id: 1,
      },
    },
  };
  const {
    Book: {
      find: { _id },
    },
  } = await requrseMongoose(query, modelOptions);
  const updateQuery = {
    Book: {
      update: {
        $params: {
          id: _id.toString(),
          data: {
            title: "Harry Potter and the Prisoner of Azkaban",
          },
        },
        title: 1,
      },
    },
  };
  await requrseMongoose(updateQuery, modelOptions);
  const findQuery = {
    Book: {
      find: {
        title: 1,
      },
    },
  };
  const result = await requrseMongoose(findQuery, modelOptions);
  assert.deepEqual(result, {
    Book: {
      find: {
        title: "Harry Potter and the Prisoner of Azkaban",
      },
    },
  });
  return _id.toString();
});
await test("Should give us empty result after removal operation of the book", async function (id) {
  const removeQuery = {
    Book: {
      remove: {
        $params: {
          id,
        },
      },
    },
  };
  await requrseMongoose(removeQuery);
  const findQuery = {
    Book: {
      find: {
        title: 1,
      },
    },
  };
  const result = await requrseMongoose(findQuery);
  assert.deepEqual(result, {
    Book: {
      find: [],
    },
  });
});

mongoose.disconnect();
