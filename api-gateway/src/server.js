import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import logger from "./utils/logger.js";
import proxy from "express-http-proxy";

const app = express();
dotenv.config();

const PORT = process.env.PORT || 3000;
const redisClient = new Redis(process.env.REDIS_URL);

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body,${req.body}`);
  next();
});

// ip based  rate limiting for sensitive endpoints
const rateLimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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

app.use(rateLimitOptions);

const proxyOPtions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({ success: false, message: "Internal server error" });
    next(err);
  },
};

// setting up proxy for our identity service

app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOPtions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from identity service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.listen(PORT, () => {
  logger.info(`Api gateway listening on port ${PORT}`);
  logger.info(`Proxying requests to ${process.env.IDENTITY_SERVICE_URL}`);
  logger.info(`Redis url ${process.env.REDIS_URL}`);
});
