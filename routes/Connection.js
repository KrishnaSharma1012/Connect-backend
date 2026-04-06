import express from "express";
import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getMyConnections,
  getPendingRequests,
  getConnectionStatus,
} from "../controllers/connection.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/:userId",          protect, sendRequest);          // AlumniCard "Connect" btn
router.patch("/:userId/accept",  protect, acceptRequest);
router.patch("/:userId/reject",  protect, rejectRequest);
router.get("/",                  protect, getMyConnections);
router.get("/pending",           protect, getPendingRequests);
router.get("/status/:userId",    protect, getConnectionStatus);  // check btn state per card

export default router;