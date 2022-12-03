import { createClient } from "redis";

let redisClient = createClient({ legacyMode: true });
redisClient
  .connect()
  .then(() => {
    console.log("Connected to redis client");
  })
  .catch(console.error);

export default redisClient;
