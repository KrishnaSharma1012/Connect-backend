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
} from "../controllers/session.controller.js";
import { protect, roleGuard, premiumGuard } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",              protect, getSessions);                              // student Academics page
router.get("/mine",          protect, roleGuard("alumni"), getMySessions);      // alumni Sessions page
router.post("/",             protect, roleGuard("alumni"), premiumGuard, createSession);
router.put("/:id",           protect, roleGuard("alumni", "admin"), updateSession);
router.delete("/:id",        protect, roleGuard("alumni", "admin"), deleteSession);
router.post("/:id/enroll",   protect, roleGuard("student"), enrollSession);
router.patch("/:id/approve", protect, roleGuard("admin"), approveSession);
router.patch("/:id/go-live", protect, roleGuard("alumni"), goLive);

export default router;