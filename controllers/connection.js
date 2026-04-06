import Connection from "../models/Connection.js";
import BaseUser from "../models/BaseUser.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/connections/request/:alumniId
// Student sends connection request to an alumni
// Used by: AlumniCard.jsx "Connect" button
// ─────────────────────────────────────────────────────────────────────────────
export const sendRequest = async (req, res) => {
  try {
    const { alumniId } = req.params;
    const studentId    = req.user.id;

    if (studentId === alumniId) {
      return res.status(400).json({ message: "Cannot connect with yourself" });
    }

    // Check alumni exists
    const alumni = await BaseUser.findById(alumniId);
    if (!alumni || alumni.role !== "alumni") {
      return res.status(404).json({ message: "Alumni not found" });
    }

    // Check if request already exists
    const existing = await Connection.findOne({
      from: studentId,
      to:   alumniId,
    });
    if (existing) {
      return res.status(409).json({
        message: existing.status === "accepted"
          ? "Already connected"
          : "Request already sent",
      });
    }

    const connection = await Connection.create({
      from:   studentId,
      to:     alumniId,
      status: "pending",
    });

    await connection.populate("from", "name avatar role college");
    await connection.populate("to",   "name avatar role company");

    res.status(201).json({ message: "Connection request sent", connection });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/connections/accept/:requestId
// Alumni accepts a pending connection request
// ─────────────────────────────────────────────────────────────────────────────
export const acceptRequest = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.requestId);
    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    // Only the recipient (alumni) can accept
    if (connection.to.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }

    connection.status = "accepted";
    await connection.save();

    res.json({ message: "Connection accepted", connection });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/connections
// Returns all accepted connections for the logged-in user
// Used by: AlumniProfile page — check if already connected
// ─────────────────────────────────────────────────────────────────────────────
export const getMyConnections = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or:    [{ from: req.user.id }, { to: req.user.id }],
      status: "accepted",
    })
      .populate("from", "name avatar role college company")
      .populate("to",   "name avatar role college company")
      .sort({ updatedAt: -1 });

    res.json({ connections });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/connections/pending
// Alumni sees all pending incoming requests
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingRequests = async (req, res) => {
  try {
    const pending = await Connection.find({
      to:     req.user.id,
      status: "pending",
    }).populate("from", "name avatar role college");

    res.json({ pending });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};