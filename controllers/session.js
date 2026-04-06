import Session from "../models/Session.js";
import BaseUser from "../models/BaseUser.js";
import Earning from "../models/Earning.js";

const PLATFORM_CUT = Number(process.env.PLATFORM_CUT) || 0.20;
const TOKEN_SESSION_COMPLETE = 20; // tokens awarded when session is marked complete

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sessions
// Query: page, limit, type (session|workshop|course)
// Used by: Academics.jsx (student), alumni/Sessions.jsx, admin/Sessions.jsx
// ─────────────────────────────────────────────────────────────────────────────
export const getSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const filter = { status: "approved" };
    if (type) filter.type = type;

    const skip     = (Number(page) - 1) * Number(limit);
    const total    = await Session.countDocuments(filter);
    const sessions = await Session.find(filter)
      .populate("instructor", "name avatar college company isVerified alumniPlan")
      .sort({ date: 1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ sessions, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sessions/my    — Alumni's own sessions
// Used by: alumni/Sessions.jsx list
// ─────────────────────────────────────────────────────────────────────────────
export const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({ instructor: req.user.id })
      .sort({ createdAt: -1 });

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sessions
// Body: { title, description, date, time, price, seats, type }
// type: "session" | "workshop" | "course"
// Premium alumni only — matches AlumniModelGate check
// Used by: alumni/Sessions.jsx create modal
// ─────────────────────────────────────────────────────────────────────────────
export const createSession = async (req, res) => {
  try {
    const user = await BaseUser.findById(req.user.id);

    if (user.alumniPlan !== "premium") {
      return res.status(403).json({ message: "Upgrade to Premium to host sessions" });
    }

    const { title, description, date, time, price, seats, type } = req.body;
    if (!title || !date || !price) {
      return res.status(400).json({ message: "Title, date, and price are required" });
    }

    const session = await Session.create({
      instructor:  req.user.id,
      title,
      description,
      date:        new Date(date),
      time:        time || "",
      price:       Number(price),
      totalSeats:  Number(seats) || 20,
      seatsLeft:   Number(seats) || 20,
      type:        type || "session",
      status:      "pending", // admin must approve
      isLive:      false,
    });

    await session.populate("instructor", "name avatar");
    res.status(201).json({ message: "Session submitted for approval", session });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/sessions/:id
// Instructor or admin can edit
// ─────────────────────────────────────────────────────────────────────────────
export const updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const isOwner = session.instructor.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not authorized" });

    const { title, description, date, time, price, seats, type } = req.body;
    if (title)       session.title       = title;
    if (description) session.description = description;
    if (date)        session.date        = new Date(date);
    if (time)        session.time        = time;
    if (price)       session.price       = Number(price);
    if (seats)       session.totalSeats  = Number(seats);
    if (type)        session.type        = type;

    await session.save();
    res.json({ message: "Session updated", session });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/sessions/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const isOwner = session.instructor.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not authorized" });

    await session.deleteOne();
    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sessions/:id/enroll
// Body: { paymentMethod, amountPaid, paymentId? }
// Checks seatsLeft > 0, records earning (80/20), decrements seats
// Used by: SessionCard enroll button → PaymentModal
// ─────────────────────────────────────────────────────────────────────────────
export const enrollSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "approved") {
      return res.status(400).json({ message: "Session is not available yet" });
    }
    if (session.seatsLeft <= 0) {
      return res.status(400).json({ message: "No seats available" });
    }

    const alreadyEnrolled = session.enrolledStudents.includes(req.user.id);
    if (alreadyEnrolled) {
      return res.status(409).json({ message: "Already enrolled in this session" });
    }

    const { paymentMethod, amountPaid, paymentId } = req.body;

    // Decrement seat
    session.enrolledStudents.push(req.user.id);
    session.seatsLeft = session.seatsLeft - 1;
    session.enrolled  = (session.enrolled || 0) + 1;
    await session.save();

    // 80/20 earnings record
    const alumniShare = Math.round(amountPaid * (1 - PLATFORM_CUT));
    await Earning.create({
      alumni:        session.instructor,
      source:        session._id,
      sourceModel:   "Session",
      title:         session.title,
      amountPaid,
      alumniShare,
      platformShare: amountPaid - alumniShare,
      student:       req.user.id,
      paymentMethod: paymentMethod || "upi",
      paymentId:     paymentId || null,
      type:          session.type,
    });

    res.json({ message: "Enrolled successfully", seatsLeft: session.seatsLeft });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/sessions/:id/approve   (admin only)
// Used by: admin/Sessions.jsx approve button
// ─────────────────────────────────────────────────────────────────────────────
export const approveSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).populate("instructor", "name email");

    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json({ message: "Session approved", session });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/sessions/:id/go-live   (admin only)
// Marks session as live + awards +20 tokens to instructor
// Used by: admin/Sessions.jsx "Go Live" button
// ─────────────────────────────────────────────────────────────────────────────
export const goLive = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    session.isLive = true;
    session.status = "live";
    await session.save();

    // Award completion tokens to alumni (+20)
    await BaseUser.findByIdAndUpdate(session.instructor, {
      $inc: { tokens: TOKEN_SESSION_COMPLETE },
    });

    res.json({ message: "Session is now live", session });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};