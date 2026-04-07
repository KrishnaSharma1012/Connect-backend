import express from "express";
import {
  signup,
  login,
  getMe,
  logout,
} from "../controllers/auth.js"; // ✅ FIX

import { protect } from "../middleware/auth.js"; // ✅ FIX

const router = express.Router();

// ─────────────────────────────
// AUTH
// ─────────────────────────────
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protect, logout); // ✅ better secured

// ─────────────────────────────
// USER
// ─────────────────────────────
router.get("/me", protect, getMe);

// ❌ REMOVE (moved to user.routes.js)
// router.patch("/upgrade-plan", protect, upgradePlan);

export default router;