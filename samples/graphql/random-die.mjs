import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList,
  GraphQLSchema,
  graphql,
} from "graphql";

const RandomDie = new GraphQLObjectType({
  name: "RandomDie",
  fields: {
    numSides: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: (die) => die.numSides,
    },
    rollOnce: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: (die) => 1 + Math.floor(Math.random() * die.numSides),
    },
    roll: {
      type: new GraphQLList(GraphQLInt),
      args: {
        numRolls: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: (die, { numRolls }) => {
        const output = [];
        for (let i = 0; i < numRolls; i++) {
          output.push(1 + Math.floor(Math.random() * die.numSides));
        }
        return output;
      },
    },
  },
});

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    getDie: {
      type: RandomDie,
      args: {
        numSides: { type: GraphQLInt },
      },
      resolve: (_, { numSides }) => {
        return { numSides: numSides || 6 };
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: QueryType,
});

const query = `
  {
    getDie(numSides: 6) {
      numSides
      rollOnce
      roll(numRolls: 3)
    }
  }
`;

graphql({
  schema,
  source: query,
}).then((response) => {
  console.log(JSON.stringify(response, null, 2));
});
