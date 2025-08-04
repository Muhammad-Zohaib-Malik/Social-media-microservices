import jwt from "jsonwebtoken";
export const generateToken = async (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, username: user.username },
    process.env.ACCESS_JWT_SECRET,
    { expiresIn: "60m" }
  );
  return { accessToken };
};
