import Course from "../models/Course.js";
import BaseUser from "../models/BaseUser.js";
import Earning from "../models/Earning.js";

const PLATFORM_CUT = Number(process.env.PLATFORM_CUT) || 0.20;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/courses
// Query: page, limit, category
// Used by: Academics.jsx (student), admin/Courses.jsx
// ─────────────────────────────────────────────────────────────────────────────
export const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 12, category } = req.query;
    const filter = { status: "approved" };
    if (category) filter.category = category;

    const skip   = (Number(page) - 1) * Number(limit);
    const total  = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
      .populate("instructor", "name avatar college company isVerified alumniPlan")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ courses, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/courses/:id
// Used by: CourseDetails.jsx
// ─────────────────────────────────────────────────────────────────────────────
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name avatar college company about isVerified tokens");

    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/courses
// Body: { title, description, price, originalPrice?, category, curriculum[]? }
// Only premium alumni can create
// Used by: Alumni Sessions.jsx create modal (courses tab)
// ─────────────────────────────────────────────────────────────────────────────
export const createCourse = async (req, res) => {
  try {
    const user = await BaseUser.findById(req.user.id);

    if (user.alumniPlan !== "premium") {
      return res.status(403).json({ message: "Upgrade to Premium to create courses" });
    }

    const { title, description, price, originalPrice, category, curriculum } = req.body;
    if (!title || !price) {
      return res.status(400).json({ message: "Title and price are required" });
    }

    const course = await Course.create({
      instructor:    req.user.id,
      title,
      description,
      price:         Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category:      category || "General",
      curriculum:    curriculum || [],
      status:        "pending",  // admin must approve — matches admin/Courses.jsx
    });

    await course.populate("instructor", "name avatar");
    res.status(201).json({ message: "Course submitted for approval", course });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/courses/:id
// Body: { title, description, price, originalPrice, category }
// Instructor or admin can edit
// ─────────────────────────────────────────────────────────────────────────────
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const isOwner = course.instructor.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not authorized" });

    const { title, description, price, originalPrice, category } = req.body;
    if (title)         course.title         = title;
    if (description)   course.description   = description;
    if (price)         course.price         = Number(price);
    if (originalPrice) course.originalPrice = Number(originalPrice);
    if (category)      course.category      = category;

    await course.save();
    res.json({ message: "Course updated", course });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/courses/:id
// Instructor or admin
// ─────────────────────────────────────────────────────────────────────────────
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const isOwner = course.instructor.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not authorized" });

    await course.deleteOne();
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/courses/:id/enroll
// Body: { paymentMethod: "card"|"upi"|"net", amountPaid, paymentId? }
// Used by: PaymentModal.jsx → CourseDetails.jsx
// 80/20 split: alumni gets 80%, platform keeps 20%
// ─────────────────────────────────────────────────────────────────────────────
export const enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.status !== "approved") {
      return res.status(400).json({ message: "Course is not available yet" });
    }

    const alreadyEnrolled = course.enrolledStudents.includes(req.user.id);
    if (alreadyEnrolled) {
      return res.status(409).json({ message: "Already enrolled in this course" });
    }

    const { paymentMethod, amountPaid, paymentId } = req.body;

    // Record enrollment
    course.enrolledStudents.push(req.user.id);
    await course.save();

    // Create earning record for alumni (80% share)
    const alumniShare = Math.round(amountPaid * (1 - PLATFORM_CUT));
    await Earning.create({
      alumni:        course.instructor,
      source:        course._id,
      sourceModel:   "Course",
      title:         course.title,
      amountPaid,
      alumniShare,
      platformShare: amountPaid - alumniShare,
      student:       req.user.id,
      paymentMethod: paymentMethod || "upi",
      paymentId:     paymentId || null,
      type:          "course",
    });

    res.json({
      message:     "Enrollment successful",
      courseId:    course._id,
      alumniShare,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/courses/:id/approve   (admin only)
// Used by: admin/Courses.jsx approve button
// ─────────────────────────────────────────────────────────────────────────────
export const approveCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).populate("instructor", "name email");

    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course approved", course });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};