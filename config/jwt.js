import jwt from "jsonwebtoken";

// 🔹 Generate JWT Token
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// 🔹 Send Token in Cookie
export const sendTokenCookie = (res, user, statusCode = 200) => {
  const token = generateToken(user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res
    .status(statusCode)
    .cookie("connect_token", token, options)
    .json({
      success: true,
      user,
      token, // optional (frontend may use it)
    });
};