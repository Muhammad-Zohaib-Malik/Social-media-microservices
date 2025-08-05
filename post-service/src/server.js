import express from "express";
import cors from "cors";
import postRoutes from "./routes/post.route.js";
import connectDB from "./config/db.js";
import helmet from "helmet";
import logger from "./utils/logger.js";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 3002;
connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

app.use("/api/posts", postRoutes);

app.listen(PORT, () => {
  logger.info(`post service is running at ${PORT}`);
});
