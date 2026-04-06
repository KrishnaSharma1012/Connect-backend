import express from "express";
import {
  signup,
  login,
  getMe,
  logout,
  upgradePlan,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup",  signup);
router.post("/login",   login);
router.post("/logout",  logout);
router.get("/me",       protect, getMe);
router.patch("/upgrade-plan", protect, upgradePlan); // alumni free → premium

export default router;