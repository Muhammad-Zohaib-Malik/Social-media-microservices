import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import helmet from "helmet";
import cors from "cors";
import logger from "./utils/logger.js";
import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import identityRouter from "./routes/identity.route.js";
import cookieParser from 'cookie-parser'


const app = express();

dotenv.config();
const PORT = process.env.PORT || 3000;
connectDB();

const redisClient = new Redis(process.env.REDIS_URL);

//middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser())
// app.use(limiter)

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body,${req.body}`);
  next();
});

const rateLimiterRedis = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiterRedis
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP :${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    });
});

// ip based  rate limiting for sensitive endpoints
const sensitiveEndpoinstLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for ip :${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use("/api/auth/register", sensitiveEndpoinstLimiter);

app.use("/api/auth/", identityRouter);

app.listen(process.env.PORT, () => {
  logger.info(`Identity service is running at ${PORT}`);
});
