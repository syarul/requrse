const {
  getFriends,
  getHero
//   getHuman,
//   getDroid
} = require('./starwarsData.cjs') // Replace with the actual path to your module
const { graphql, buildSchema } = require('graphql')

const resolvers = {
  Query: {
    hero: (parent, { episode }) => getHero(episode)
  },
  Character: {
    friends: (character) => getFriends(character)
  }
}

const schema = buildSchema(`
  type Character {
    id: String!
    name: String!
    friends: [Character]
    appearsIn: [Int]
    homePlanet: String
    primaryFunction: String
  }

  type Query {
    hero(episode: Int): Character
  }
`)

const query = `
  query {
    hero(episode: 5) {
      name
    }
  }
`

graphql(schema, query, resolvers).then((response) => {
  console.log(response.data)
})
