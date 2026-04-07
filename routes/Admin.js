import express from "express";
import {
  getUsers,
  verifyUser,
  suspendUser,
  restoreUser,
  deleteUser,
  getStats,
  getAnalytics,
  getAllSessions,
  getAllCourses,
} from "../controllers/admin.js";

// ✅ FIX: correct middleware path
import { protect, roleGuard } from "../middleware/auth.js";

const router = express.Router();

// ✅ Cleaner approach (applies to all routes below)
router.use(protect, roleGuard("admin"));

// ─────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────
router.get("/users", getUsers);
router.patch("/users/:id/verify", verifyUser);
router.patch("/users/:id/suspend", suspendUser);
router.patch("/users/:id/restore", restoreUser);
router.delete("/users/:id", deleteUser);

// ─────────────────────────────
// DASHBOARD
// ─────────────────────────────
router.get("/stats", getStats);
router.get("/analytics", getAnalytics);

// ─────────────────────────────
// CONTENT MANAGEMENT
// ─────────────────────────────
router.get("/sessions", getAllSessions);
router.get("/courses", getAllCourses);

export default router;