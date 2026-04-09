import Connection from "../models/Connection.js";
import BaseUser from "../models/BaseUser.js";

// ─────────────────────────────────────────────
// SEND REQUEST
// ─────────────────────────────────────────────
export const sendRequest = async (req, res) => {
  try {
    const alumniId = req.params.id; // ✅ FIX
    const studentId = req.user._id;

    if (studentId.toString() === alumniId) {
      return res.status(400).json({ message: "Cannot connect with yourself" });
    }

    const alumni = await BaseUser.findById(alumniId);
    if (!alumni || alumni.role !== "alumni") {
      return res.status(404).json({ message: "Alumni not found" });
    }

    const existing = await Connection.findOne({
      $or: [
        { from: studentId, to: alumniId },
        { from: alumniId, to: studentId },
      ],
    });

    if (existing) {
      return res.status(409).json({
        message:
          existing.status === "accepted"
            ? "Already connected"
            : "Request already exists",
      });
    }

    const connection = await Connection.create({
      from: studentId,
      to: alumniId,
      status: "pending",
    });

    await connection.populate("from", "name avatar role college");
    await connection.populate("to", "name avatar role company");

    res.status(201).json({ message: "Connection request sent", connection });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// ACCEPT REQUEST
// ─────────────────────────────────────────────
export const acceptRequest = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id); // ✅ FIX

    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (connection.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    connection.status = "accepted";
    await connection.save();

    res.json({ message: "Connection accepted", connection });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// REJECT REQUEST
// ─────────────────────────────────────────────
export const rejectRequest = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id); // ✅ FIX

    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (connection.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    connection.status = "rejected";
    await connection.save();

    res.json({ message: "Connection rejected", connection });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET MY CONNECTIONS
// ─────────────────────────────────────────────
export const getMyConnections = async (req, res) => {
  try {
    const userId = req.user._id;

    const connections = await Connection.find({
      $or: [{ from: userId }, { to: userId }],
      status: "accepted",
    })
      .populate("from", "name avatar role college company")
      .populate("to", "name avatar role college company")
      .sort({ updatedAt: -1 });

    res.json({ connections });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET PENDING REQUESTS
// ─────────────────────────────────────────────
export const getPendingRequests = async (req, res) => {
  try {
    const pending = await Connection.find({
      to: req.user._id,
      status: "pending",
    }).populate("from", "name avatar role college");

    res.json({ pending });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET CONNECTION STATUS
// ─────────────────────────────────────────────
export const getConnectionStatus = async (req, res) => {
  try {
    const userId = req.params.id; // ✅ FIX
    const currentUserId = req.user._id;

    const connection = await Connection.findOne({
      $or: [
        { from: currentUserId, to: userId },
        { from: userId, to: currentUserId },
      ],
    });

    if (!connection) {
      return res.json({ status: "connect" }); // ✅ FIX
    }

    res.json({ status: connection.status });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};