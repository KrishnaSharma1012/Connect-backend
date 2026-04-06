import bcrypt from "bcryptjs";
import BaseUser from "../models/BaseUser.js";
import { generateToken, sendTokenCookie } from "../config/jwt.js";

// ─── Helper: build safe user object for frontend ──────────────────────────────
const safeUser = (user) => ({
  id:          user._id,
  name:        user.name,
  email:       user.email,
  role:        user.role,
  college:     user.college,
  company:     user.company,
  alumniPlan:  user.alumniPlan,   // "simple" | "premium" | null
  avatar:      user.avatar,
  coverPhoto:  user.coverPhoto,
  about:       user.about,
  skills:      user.skills,
  isVerified:  user.isVerified,
  status:      user.status,
  tokens:      user.tokens,
  has24hReply: user.has24hReply,
  isCollegePartner: user.isCollegePartner,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// Body: { name, email, password, role, college?, company?, alumniPlan? }
// ─────────────────────────────────────────────────────────────────────────────
export const signup = async (req, res) => {
  try {
    const { name, email, password, role, college, company, alumniPlan } = req.body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["student", "alumni", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const exists = await BaseUser.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // ── Hash password ──────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Create user ────────────────────────────────────────────────────────
    const user = await BaseUser.create({
      name,
      email:      email.toLowerCase(),
      password:   hashedPassword,
      role,
      college:    role === "student" ? college : undefined,
      company:    role === "alumni"  ? company : undefined,
      alumniPlan: role === "alumni"  ? (alumniPlan || "simple") : undefined,
    });

    const token = generateToken(user._id, user.role);
    sendTokenCookie(res, token);

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password, role }
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user and include password field (excluded by default via schema)
    const user = await BaseUser.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Role mismatch check — matches frontend role selector on Login page
    if (user.role !== role) {
      return res.status(401).json({ message: `No ${role} account found with this email` });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Your account has been suspended. Contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, user.role);
    sendTokenCookie(res, token);

    res.json({
      message: "Login successful",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me   (protected)
// Returns current user from JWT
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await BaseUser.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// Clears the HTTP-only cookie
// ─────────────────────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  res.clearCookie("connect_token");
  res.json({ message: "Logged out successfully" });
};