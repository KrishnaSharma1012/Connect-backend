import express from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/conversations",      protect, getConversations);   // ConversationList.jsx
router.get("/:userId",            protect, getMessages);        // ChatWindow.jsx thread
router.post("/:userId",           protect, sendMessage);        // send message to user
router.patch("/:userId/read",     protect, markAsRead);         // mark thread as read

export default router;