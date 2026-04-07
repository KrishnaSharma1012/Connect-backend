import express from "express";
import {
  getSessions,
  getMySessions,
  createSession,
  updateSession,
  deleteSession,
  enrollSession,
  approveSession,
  goLive,
} from "../controllers/session.js";

import { protect, roleGuard, premiumGuard } from "../middleware/auth.js";

const router = express.Router();

// ─────────────────────────────
// PUBLIC
// ─────────────────────────────
router.get("/", getSessions); // ✅ no need protect

// ─────────────────────────────
// ALUMNI
// ─────────────────────────────
router.get("/my", protect, roleGuard("alumni"), getMySessions); // ✅ FIX (mine → my)

router.post("/", protect, roleGuard("alumni"), premiumGuard, createSession);

router.put("/:id", protect, roleGuard("alumni", "admin"), updateSession);
router.delete("/:id", protect, roleGuard("alumni", "admin"), deleteSession);

// ─────────────────────────────
// STUDENT
// ─────────────────────────────
router.post("/:id/enroll", protect, enrollSession); // ✅ role handled logically

// ─────────────────────────────
// ADMIN
// ─────────────────────────────
router.patch("/:id/approve", protect, roleGuard("admin"), approveSession);
router.patch("/:id/live", protect, roleGuard("admin"), goLive); // ✅ FIX

export default router;