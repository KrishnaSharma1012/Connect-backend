import jwt from "jsonwebtoken";
import BaseUser from "../models/BaseUser.js";

// ── Protect: verify JWT, attach user to req ─────────────────
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization header
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    // 2. Check cookie (IMPORTANT FIX)
    else if (req.cookies?.connect_token) {
      token = req.cookies.connect_token;
    }

    if (!token) {
      return res.status(401).json({ message: "Not authenticated. Please log in." });
    }

    // 🔹 Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 Find user (IMPORTANT FIX)
    const user = await BaseUser.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    // 🔹 Suspension check (IMPORTANT FIX)
    if (user.status === "suspended") {
      return res.status(403).json({ message: "Your account has been suspended." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// ── Role guard ──────────────────
export const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        message: `Access denied. Requires role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};

// ── Premium guard ─────────────────
export const premiumGuard = (req, res, next) => {
  if (req.user?.role === "alumni" && req.user?.alumniPlan !== "premium") {
    return res.status(403).json({
      message: "Upgrade to Premium to access this feature.",
    });
  }
  next();
};