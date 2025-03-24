import { User } from "../models/identity.model.js";
import { generateToken } from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import { validateLogin, validateRegistration } from "../utils/validation.js";

export const registerUser = async (req, res) => {
  logger.info("Registration hit point end");
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error ", error.details[0].message);
      return res
        .status(404)
        .json({ success: false, message: error.details[0].message });
    }

    const { username, email, password } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists ");
      return res
        .status(404)
        .json({ success: false, message: "User already exists" });
    }

    user = new User({
      username,
      email,
      password,
    });

    await user.save();
    logger.info("user created successfully", user);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    logger.error("Registeration error occur", error);
    res.status(500).json({ success: false, message: "Internal error" });
  }
};

export const loginUser = async (req, res) => {
  logger.info("Login hit point end");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error ", error.details[0].message);
      return res
        .status(404)
        .json({ success: false, message: error.details[0].message });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("User not exists ");
      return res
        .status(404)
        .json({ success: false, message: "User not exists" });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      logger.warn("Invalid Password ");
      return res
        .status(404)
        .json({ success: false, message: "Invalid credentials" });
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateToken(user);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "User login successfully",
        accessToken,
        refreshToken,
        user,
      });
  } catch (error) {
    logger.error("Login error occur", error);
    res.status(500).json({ success: false, message: "Internal error" });
  }
};

export const logoutUser = async (req, res) => {
  logger.info("Logout hit point end");
  const userId = req.user._id;

   await User.findByIdAndUpdate(
    userId,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({ success: true, message: "user logged out successfully" });
};
