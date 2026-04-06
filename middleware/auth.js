import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

// ── Protect: verify JWT, attach user to req ─────────────────
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization header first
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    // 2. Fall back to HTTP-only cookie
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Not authenticated. Please log in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: "Your account has been suspended." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// ── Role guard: restrict to specific roles ──────────────────
// Usage: roleGuard("admin") or roleGuard("admin", "alumni")
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

// ── Premium guard: alumni must have alumniPlan === "premium" ─
export const premiumGuard = (req, res, next) => {
  if (req.user?.role === "alumni" && req.user?.alumniPlan !== "premium") {
    return res.status(403).json({
      message: "Upgrade to Premium to access this feature.",
    });
  }
  next();
};