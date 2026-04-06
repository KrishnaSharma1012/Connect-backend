import express from "express";
import {
  getAlumni,
  getUserById,
  updateProfile,
  uploadAvatar,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/alumni",      protect, getAlumni);        // Networking page alumni list
router.get("/:id",         protect, getUserById);      // AlumniProfile page
router.put("/profile",     protect, updateProfile);    // EditProfile.jsx
router.post("/avatar",     protect, uploadAvatar);     // Cloudinary avatar upload

export default router;