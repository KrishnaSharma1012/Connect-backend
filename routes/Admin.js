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
} from "../controllers/admin.controller.js";
import { protect, roleGuard } from "../middleware/auth.middleware.js";

const router = express.Router();

// All admin routes locked to role "admin"
const guard = [protect, roleGuard("admin")];

router.get("/users",            ...guard, getUsers);
router.patch("/users/:id/verify",  ...guard, verifyUser);
router.patch("/users/:id/suspend", ...guard, suspendUser);
router.patch("/users/:id/restore", ...guard, restoreUser);
router.delete("/users/:id",        ...guard, deleteUser);
router.get("/stats",            ...guard, getStats);
router.get("/analytics",        ...guard, getAnalytics);
router.get("/sessions",         ...guard, getAllSessions);
router.get("/courses",          ...guard, getAllCourses);

export default router;