import express from "express";
import {
  getMyEarnings,
  getEarningStats,
  requestWithdrawal,
} from "../controllers/earning.controller.js";
import { protect, roleGuard, premiumGuard } from "../middleware/auth.middleware.js";

const router = express.Router();

// All earning routes: alumni + premium only
router.get("/",            protect, roleGuard("alumni"), premiumGuard, getMyEarnings);
router.get("/stats",       protect, roleGuard("alumni"), premiumGuard, getEarningStats);
router.post("/withdraw",   protect, roleGuard("alumni"), premiumGuard, requestWithdrawal);

export default router;