import mongoose from "mongoose";

// Each student's enrollment record — created after payment
const enrollmentSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrolledAt:    { type: Date, default: Date.now },
  paymentId:     { type: String, default: '' },
  paymentMethod: { type: String, enum: ['card', 'upi', 'net'], default: 'upi' },
  amountPaid:    { type: Number, default: 0 },
}, { _id: false });

const sessionSchema = new mongoose.Schema(
  {
    // ── Content ───────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      // e.g. "System Design Live Session", "React Workshop – Build & Deploy"
    },
    description: {
      type: String,
      required: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      // SessionCard shows 2 lines (WebkitLineClamp: 2)
    },

    // ── Instructor (Alumni, Premium only) ─────────────────────
    // SessionCard: "by Rahul Sharma (Google)" in teal
    // AlumniProfile → Sessions tab: instructor's sessions listed
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Type ──────────────────────────────────────────────────
    // Alumni create modal type selector buttons: "Session" | "Workshop" | "Course"
    // Shown as badge on alumni Sessions page cards
    // Earnings page transaction typeColors: session | workshop | course | mentorship
    type: {
      type: String,
      enum: ['session', 'workshop', 'course'],
      default: 'session',
    },

    // ── Schedule ──────────────────────────────────────────────
    // SessionCard date/time box: "📅 25 April 2026  ⏰ 6:00 PM IST"
    date:     { type: Date,   required: true },
    time:     { type: String, required: true },
    // e.g. "6:00 PM IST", "7:00 PM IST"
    duration: { type: Number, default: 60 },
    // in minutes

    // ── Pricing ───────────────────────────────────────────────
    // Alumni keeps 80%, Connect takes 20%
    // Live earnings preview in Create Session modal:
    //   "At ₹999/student · Your share: ₹799 per enrollment"
    // Sessions page revenue split notice:
    //   "Platform takes 20% · You keep 80%"
    price: { type: Number, required: true, min: 0 },

    // ── Seats ─────────────────────────────────────────────────
    // SessionCard: "🔥 5 seats left" warning shown when seatsLeft <= 5
    // SessionCard: "Full" button + disabled when seatsLeft === 0
    // Alumni Sessions page: progress bar (enrolled / totalSeats)
    //   e.g. "75% full 🔥" for high fill
    totalSeats: { type: Number, required: true, min: 1 },

    // ── Enrollments ───────────────────────────────────────────
    enrolledStudents: [enrollmentSchema],

    // ── Status ────────────────────────────────────────────────
    // SessionCard badge: "LIVE NOW" (red) vs "UPCOMING" (teal)
    isLive:      { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },

    // ── Meeting ───────────────────────────────────────────────
    meetingLink: { type: String, default: '' },

    // ── Admin Approval ────────────────────────────────────────
    // Admin reviews in /admin/sessions before session is visible to students
    isApproved:  { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },

    tags: [String],
  },
  { timestamps: true }
);

// ── Virtuals ─────────────────────────────────────────────────

// SessionCard: "🔥 {seatsLeft} seats left" (shown when <= 5)
// SessionCard: "Full" when seatsLeft === 0
sessionSchema.virtual('seatsLeft').get(function () {
  return this.totalSeats - this.enrolledStudents.length;
});

// Alumni Sessions page: progress bar numerator
sessionSchema.virtual('enrolledCount').get(function () {
  return this.enrolledStudents.length;
});

// Alumni Sessions page: "your share" shown in top-right of card
// Earnings.jsx: "₹{Math.round(earned).toLocaleString()}"
sessionSchema.virtual('alumniShare').get(function () {
  return Math.round(this.enrolledStudents.length * this.price * 0.8);
});

// Alumni Sessions page: progress bar fill percent
// "75% full 🔥" when pct >= 80
sessionSchema.virtual('fillPercent').get(function () {
  return Math.round((this.enrolledStudents.length / this.totalSeats) * 100);
});

sessionSchema.set('toJSON',   { virtuals: true });
sessionSchema.set('toObject', { virtuals: true });

// ── Indexes ──────────────────────────────────────────────────
sessionSchema.index({ instructor: 1 });
sessionSchema.index({ date: 1 });
sessionSchema.index({ isApproved: 1, isPublished: 1, isCompleted: 1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;