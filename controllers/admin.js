import BaseUser from "../models/BaseUser.js";
import Session from "../models/Session.js";
import Course from "../models/Course.js";

// ─────────────────────────────
// GET USERS
// ─────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const users = await BaseUser.find().select("-password");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────
// VERIFY USER
// ─────────────────────────────
export const verifyUser = async (req, res) => {
  try {
    const user = await BaseUser.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );

    res.json({ message: "User verified", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────
// SUSPEND USER
// ─────────────────────────────
export const suspendUser = async (req, res) => {
  try {
    const user = await BaseUser.findByIdAndUpdate(
      req.params.id,
      { isSuspended: true },
      { new: true }
    );

    res.json({ message: "User suspended", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────
// RESTORE USER
// ─────────────────────────────
export const restoreUser = async (req, res) => {
  try {
    const user = await BaseUser.findByIdAndUpdate(
      req.params.id,
      { isSuspended: false },
      { new: true }
    );

    res.json({ message: "User restored", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────
// DELETE USER
// ─────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    await BaseUser.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────
// STATS
// ─────────────────────────────
export const getStats = async (req, res) => {
  try {
    const users = await BaseUser.countDocuments();
    const sessions = await Session.countDocuments();
    const courses = await Course.countDocuments();

    res.json({ users, sessions, courses });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────
// ANALYTICS (BASIC)
// ─────────────────────────────
export const getAnalytics = async (req, res) => {
  try {
    const verifiedUsers = await BaseUser.countDocuments({ isVerified: true });
    const premiumUsers = await BaseUser.countDocuments({ alumniPlan: "premium" });

    res.json({ verifiedUsers, premiumUsers });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────
// GET ALL SESSIONS
// ─────────────────────────────
export const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find().populate("instructor", "name email");
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────
// GET ALL COURSES
// ─────────────────────────────
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "name email");
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};