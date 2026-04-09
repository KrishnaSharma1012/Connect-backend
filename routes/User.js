import express from "express";
import {
  getAlumni,
  getUserById,
  updateProfile,
  upgradePlan,
} from "../controllers/user.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

// ─────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────

// Get all alumni (networking page)
router.get("/alumni", getAlumni);

// ─────────────────────────────
// PROTECTED ROUTES
// ─────────────────────────────
router.use(protect);

// Get single user profile
router.get("/:id", getUserById);

// Update profile (includes avatar upload already)
router.put("/profile", updateProfile);

// Upgrade alumni plan (simple → premium)
router.patch("/upgrade-plan", upgradePlan);

export default router;