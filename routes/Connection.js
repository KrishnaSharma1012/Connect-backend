import express from "express";
import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getMyConnections,
  getPendingRequests,
  getConnectionStatus,
} from "../controllers/connection.js"; // ✅ FIX

import { protect } from "../middleware/auth.js"; // ✅ FIX

const router = express.Router();

// ─────────────────────────────
// CONNECTION ACTIONS
// ─────────────────────────────
router.post("/request/:alumniId", protect, sendRequest); // ✅ FIX
router.patch("/accept/:requestId", protect, acceptRequest); // ✅ FIX
router.patch("/reject/:requestId", protect, rejectRequest); // ✅ FIX

// ─────────────────────────────
// FETCH DATA
// ─────────────────────────────
router.get("/", protect, getMyConnections);
router.get("/pending", protect, getPendingRequests);
router.get("/status/:userId", protect, getConnectionStatus);

export default router;