import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
export const isAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken
      console.log(token)
      //  ||
      // req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res
        .status(404)
        .json({ success: false, message: "Token is missing" });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error("isAuth error occur", error);
    res.status(500).json({ success: false, message: "Internal error" });
  }
};
