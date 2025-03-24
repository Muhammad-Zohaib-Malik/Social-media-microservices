import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import { User } from "../models/identity.model.js";
export const isAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res
        .status(404)
        .json({ success: false, message: "Token is missing" });
    }
 
    const decodedToken = jwt.verify(token, process.env.ACCESS_JWT_SECRET);
    const user = await User.findById(decodedToken.userId).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid user" });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error("isAuth error occur", error);
    res.status(500).json({ success: false, message: "Internal error" });
  }
};
