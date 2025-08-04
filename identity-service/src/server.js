import express from "express";
import connectDB from "./config/db.js";
import helmet from "helmet";
import cors from "cors";
import logger from "./utils/logger.js";
import { RateLimiterRedis } from "rate-limiter-flexible";
import redisClient from "./config/redis.js";
import identityRouter from "./routes/identity.route.js";
import cookieParser from "cookie-parser";
import { sensitiveEndpointsLimiter } from "./utils/rateLimiting.js";

const app = express();
const PORT = process.env.PORT || 3000;

//middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body,${req.body}`);
  next();
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP :${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    });
});

app.use("/api/auth/register", sensitiveEndpointsLimiter);

app.use("/api/auth/", identityRouter);

app.listen(process.env.PORT, () => {
  logger.info(`Identity service is running at ${PORT}`);
  connectDB();
});
