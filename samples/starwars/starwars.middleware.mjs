import rq from "../../libs/executor.cjs";
import * as starwarsData from "./starwarsData.cjs";

const config = (param) => starwarsData[param];

const methods = {
  hero: "getHero",
  friends: "getFriends",
  human: "getHuman",
  droid: "getDroid",
  secretBackstory() {
    throw new Error("secretBackstory is secret.");
  },
};

const middleware = (query) => rq(query, { methods, config });

export default middleware;
