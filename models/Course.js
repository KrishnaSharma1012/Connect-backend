import mongoose from "mongoose";

// Reviews from students — shown on AlumniProfile → Reviews tab
const reviewSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  // ⭐⭐⭐⭐⭐ shown as repeated star emoji on Reviews tab
  comment: { type: String, maxlength: 500 },
}, { timestamps: true });

// Each student's enrollment record — created after PaymentModal success
const enrollmentSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrolledAt:    { type: Date, default: Date.now },
  paymentId:     { type: String, default: '' },
  paymentMethod: { type: String, enum: ['card', 'upi', 'net'], default: 'upi' },
  // PaymentModal: "💳 Credit/Debit Card" | "📱 UPI" | "🏦 Net Banking"
  amountPaid:    { type: Number, default: 0 },
}, { _id: false });

const courseSchema = new mongoose.Schema(
  {
    // ── Content ───────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      // e.g. "Crack FAANG Interviews", "Frontend Mastery"
    },
    description: {
      type: String,
      required: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      // CourseCard shows 2 lines (WebkitLineClamp: 2)
    },

    // ── Instructor (Alumni) ────────────────────────────────────
    // CourseCard: "by Rahul Sharma (Google)" in purple
    // AlumniProfile → Sessions tab: instructor's sessions listed
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Pricing ───────────────────────────────────────────────
    // CourseCard shows: ₹1,999 with ₹2,999 strikethrough + "33% OFF" teal badge
    // PaymentModal title: "Pay ₹1,999 →"
    price:         { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0 },

    // CourseCard "🏛 Partner" badge
    // Academics page banner: "Partner College Discount Active — Up to 30% off"
    isCollegePartner: { type: Boolean, default: false },

    // ── Metadata ──────────────────────────────────────────────
    thumbnail: { type: String, default: '' },
    tags:      [String],
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    duration: { type: String, default: '' },
    // e.g. "10 hours", "3-hour hands-on workshop"

    // ── Enrollments ───────────────────────────────────────────
    // Populated after PaymentModal success screen: "🎉 Payment Successful!"
    // CourseCard shows: "({students} students)" next to star rating
    enrolledStudents: [enrollmentSchema],

    // ── Reviews & Rating ──────────────────────────────────────
    // AlumniProfile → Reviews tab shows these
    // CourseCard shows: "⭐ 4.8 (1240 students)"
    reviews: [reviewSchema],
    rating: {
      average: { type: Number, default: 0 },
      count:   { type: Number, default: 0 },
    },

    // ── Admin Approval ────────────────────────────────────────
    // Admin reviews in /admin/courses before course is visible to students
    isPublished: { type: Boolean, default: true },
    isApproved:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Methods ──────────────────────────────────────────────────

// Recalculate rating after new review
courseSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = { average: 0, count: 0 };
    return;
  }
  const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.rating = {
    average: Math.round((total / this.reviews.length) * 10) / 10,
    count:   this.reviews.length,
  };
};

// ── Virtuals ─────────────────────────────────────────────────

// Total enrolled students count
courseSchema.virtual('studentsCount').get(function () {
  return this.enrolledStudents.length;
});

// Discount % shown as teal badge on CourseCard: "33% OFF"
courseSchema.virtual('discountPercent').get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return null;
  return Math.round((1 - this.price / this.originalPrice) * 100);
});

courseSchema.set('toJSON',   { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

// ── Indexes ──────────────────────────────────────────────────
courseSchema.index({ instructor: 1 });
courseSchema.index({ isApproved: 1, isPublished: 1 });
courseSchema.index({ 'rating.average': -1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;