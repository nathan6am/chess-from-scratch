import Redis from "ioredis";

const connectionString = process.env.REDIS_CONNECTION_STRING;
if (!connectionString)
  throw new Error(
    "Redis connection string is not defined in environment variables"
  );
const redis = new Redis(connectionString);

export default redis;
