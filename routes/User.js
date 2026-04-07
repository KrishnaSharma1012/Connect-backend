import express from "express";
import {
  getAlumni,
  getUserById,
  updateProfile,
  uploadAvatar,
  upgradePlan, // ✅ ADD (missing)
} from "../controllers/user.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

// ─────────────────────────────
// PUBLIC / SEMI-PUBLIC
// ─────────────────────────────
router.get("/alumni", getAlumni); // ✅ better without auth
router.get("/:id", protect, getUserById);

// ─────────────────────────────
// USER ACTIONS
// ─────────────────────────────
router.use(protect); // ✅ cleaner

router.put("/profile", updateProfile);
router.post("/avatar", uploadAvatar);

// ✅ ADD (important — you removed from auth.routes earlier)
router.patch("/upgrade-plan", upgradePlan);

export default router;