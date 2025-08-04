import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import logger from "../utils/logger.js";
import redisClient from "../config/redis.js";


export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for ip: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rate_limit:",
  }),
});
