import mongoose from "mongoose";
import logger from "../utils/logger.js";
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`
    );
    logger.info(`Connected to mongodb :${connectionInstance.connection.host}`)
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    logger.error('MongoDb connection error',error)
    console.log("MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

export default connectDB;