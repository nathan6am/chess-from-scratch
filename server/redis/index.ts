import redisClient from "../redis/sessionClient";
export async function activeGameByUserID(userID: string): Promise<string | null> {
    const game = await redisClient.get(`${userID}:game`);
    if (game) return game;
    return null;
  }

