import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error("Missing required environment variable: REDIS_URL");

export const redis = new Redis(redisUrl, { maxRetriesPerRequest: null, tls: {} });