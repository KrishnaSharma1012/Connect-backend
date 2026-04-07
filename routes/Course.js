import express from "express";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  approveCourse,
} from "../controllers/course.js"; // ✅ FIX

import { protect, roleGuard } from "../middleware/auth.js"; // ✅ FIX

const router = express.Router();

// ─────────────────────────────
// PUBLIC
// ─────────────────────────────
router.get("/", getCourses);          // ✅ no need protect
router.get("/:id", getCourseById);

// ─────────────────────────────
// ALUMNI (CREATE / MANAGE)
// ─────────────────────────────
router.post("/", protect, roleGuard("alumni"), createCourse);

router.put("/:id", protect, roleGuard("alumni", "admin"), updateCourse);
router.delete("/:id", protect, roleGuard("alumni", "admin"), deleteCourse);

// ─────────────────────────────
// STUDENT (ENROLL)
// ─────────────────────────────
router.post("/:id/enroll", protect, enrollCourse); // ✅ role check handled logically

// ─────────────────────────────
// ADMIN
// ─────────────────────────────
router.patch("/:id/approve", protect, roleGuard("admin"), approveCourse);

export default router;