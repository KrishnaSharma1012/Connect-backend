import express from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from "../controllers/message.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

// ─────────────────────────────
// MESSAGES
// ─────────────────────────────
router.use(protect); // ✅ cleaner (applies to all routes)

router.get("/conversations", getConversations);
router.get("/:userId", getMessages);

router.post("/:userId", sendMessage);

// ✅ FIX (route order + clarity)
router.patch("/read/:userId", markAsRead);

export default router;