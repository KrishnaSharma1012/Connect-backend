import Session from "../models/Session.js";
import BaseUser from "../models/BaseUser.js";
import Earning from "../models/Earning.js";

const PLATFORM_CUT = Number(process.env.PLATFORM_CUT) || 0.20;
const TOKEN_SESSION_COMPLETE = 20;

// ─────────────────────────────────────────────
// GET SESSIONS
// ─────────────────────────────────────────────
export const getSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;

    const filter = { status: "approved" };
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Session.countDocuments(filter);

    const sessions = await Session.find(filter)
      .populate("instructor", "name avatar college company isVerified alumniPlan")
      .sort({ date: 1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      sessions,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET MY SESSIONS
// ─────────────────────────────────────────────
export const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({ instructor: req.user._id }) // ✅ FIX
      .sort({ createdAt: -1 });

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// CREATE SESSION
// ─────────────────────────────────────────────
export const createSession = async (req, res) => {
  try {
    const user = await BaseUser.findById(req.user._id); // ✅ FIX

    if (user.alumniPlan !== "premium") {
      return res.status(403).json({ message: "Upgrade to Premium to host sessions" });
    }

    const { title, description, date, time, price, seats, type } = req.body;

    if (!title || !date || !price) {
      return res.status(400).json({ message: "Title, date, and price are required" });
    }

    const session = await Session.create({
      instructor: req.user._id, // ✅ FIX
      title,
      description,
      date: new Date(date),
      time: time || "",
      price: Number(price),
      totalSeats: Number(seats) || 20,
      // ❌ DO NOT SET seatsLeft manually (virtual)
      type: type || "session",
      status: "pending",
      isLive: false,
      enrolledStudents: [],
    });

    await session.populate("instructor", "name avatar");

    res.status(201).json({ message: "Session submitted for approval", session });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE SESSION
// ─────────────────────────────────────────────
export const updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const isOwner = session.instructor.toString() === req.user._id.toString(); // ✅ FIX
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { title, description, date, time, price, seats, type } = req.body;

    if (title) session.title = title;
    if (description) session.description = description;
    if (date) session.date = new Date(date);
    if (time) session.time = time;
    if (price) session.price = Number(price);
    if (seats) session.totalSeats = Number(seats);
    if (type) session.type = type;

    await session.save();

    res.json({ message: "Session updated", session });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// DELETE SESSION
// ─────────────────────────────────────────────
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const isOwner = session.instructor.toString() === req.user._id.toString(); // ✅ FIX
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await session.deleteOne();

    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// ENROLL SESSION
// ─────────────────────────────────────────────
export const enrollSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "approved") {
      return res.status(400).json({ message: "Session is not available yet" });
    }

    const userId = req.user._id;

    const alreadyEnrolled = session.enrolledStudents.includes(userId);
    if (alreadyEnrolled) {
      return res.status(409).json({ message: "Already enrolled" });
    }

    // ❌ DO NOT use seatsLeft stored value
    const seatsLeft = session.totalSeats - session.enrolledStudents.length;

    if (seatsLeft <= 0) {
      return res.status(400).json({ message: "No seats available" });
    }

    const { paymentMethod, amountPaid, paymentId } = req.body;

    session.enrolledStudents.push(userId);
    await session.save();

    // ✅ FIX earnings
    const grossAmount = Number(amountPaid);
    const platformFee = Math.round(grossAmount * PLATFORM_CUT);

    await Earning.create({
      alumni: session.instructor,
      source: session._id,
      sourceModel: "Session",
      title: session.title,
      grossAmount,   // ✅ FIX
      platformFee,   // ✅ FIX
      student: userId,
      paymentMethod: paymentMethod || "upi",
      paymentId: paymentId || null,
      type: session.type,
    });

    res.json({
      message: "Enrolled successfully",
      seatsLeft: session.totalSeats - session.enrolledStudents.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// APPROVE SESSION
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// GO LIVE
// ─────────────────────────────────────────────
export const goLive = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    session.isLive = true;
    session.status = "live";
    await session.save();

    await BaseUser.findByIdAndUpdate(session.instructor, {
      $inc: { tokens: TOKEN_SESSION_COMPLETE },
    });

    res.json({ message: "Session is now live", session });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};