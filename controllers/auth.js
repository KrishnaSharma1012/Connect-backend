import BaseUser from "../models/BaseUser.js";
import jwt from "jsonwebtoken";

// ─────────────────────────────────────────────
// GENERATE TOKEN
// ─────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ─────────────────────────────────────────────
// SIGNUP
// ─────────────────────────────────────────────
export const signup = async (req, res) => {
  try {
    const { name, email, password, role, college, company } = req.body;

    // check existing user
    const existingUser = await BaseUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // create user
    const user = await BaseUser.create({
      name,
      email,
      password,
      role,
      college,
      company,
    });

    const token = generateToken(user._id);

    // cookie (optional)
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.status(201).json({
      message: "Signup successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await BaseUser.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // compare password (simple for now)
    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET ME
// ─────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await BaseUser.findById(req.user._id).select("-password");

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
export const logout = (req, res) => {
  res.clearCookie("token");

  res.json({ message: "Logged out successfully" });
};