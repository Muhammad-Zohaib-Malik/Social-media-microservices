import mongoose from "mongoose";
import logger from "../utils/logger.js";
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`
    );
    logger.info(`Connected to mongodb :${connectionInstance.connection.host}`);
  } catch (error) {
    logger.error("MongoDb connection error", error);
    process.exit(1);
  }
};

export default connectDB;
