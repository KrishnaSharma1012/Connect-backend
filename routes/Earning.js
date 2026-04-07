import express from "express";
import {
  getMyEarnings,
  getEarningStats,
  requestWithdrawal,
} from "../controllers/earning.js";

import { protect, roleGuard, premiumGuard } from "../middleware/auth.js";

const router = express.Router();

// ✅ Apply guards once (cleaner)
router.use(protect, roleGuard("alumni"), premiumGuard);

// ─────────────────────────────
// EARNINGS
// ─────────────────────────────
router.get("/", getMyEarnings);
router.get("/stats", getEarningStats);
router.post("/withdraw", requestWithdrawal);

export default router;