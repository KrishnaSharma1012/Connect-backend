import express from "express";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  approveCourse,
} from "../controllers/course.controller.js";
import { protect, roleGuard, premiumGuard } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",          protect, getCourses);
router.get("/:id",       protect, getCourseById);
router.post("/",         protect, roleGuard("alumni"), premiumGuard, createCourse);
router.put("/:id",       protect, roleGuard("alumni", "admin"), updateCourse);
router.delete("/:id",    protect, roleGuard("alumni", "admin"), deleteCourse);
router.post("/:id/enroll",  protect, roleGuard("student"), enrollCourse);
router.patch("/:id/approve", protect, roleGuard("admin"), approveCourse);

export default router;