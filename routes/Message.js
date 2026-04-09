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
// APPLY AUTH MIDDLEWARE
// ─────────────────────────────
router.use(protect);

// ─────────────────────────────
// MESSAGES
// ─────────────────────────────

// Get all conversations
router.get("/conversations", getConversations);

// Get chat with specific user
router.get("/:userId", getMessages);

// Send message
router.post("/:userId", sendMessage);

// Mark messages as read (FIXED)
router.patch("/:userId/read", markAsRead);

export default router;