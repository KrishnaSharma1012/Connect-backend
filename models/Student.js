const mongoose = require('mongoose');
const BaseUser = require('./BaseUser');

// ── Sub-schemas ──────────────────────────────────────────────

// Each course the student has enrolled in via PaymentModal
const enrolledCourseSchema = new mongoose.Schema({
  course:        { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrolledAt:    { type: Date, default: Date.now },
  paymentId:     { type: String, default: '' },
  paymentMethod: { type: String, enum: ['card', 'upi', 'net'], default: 'upi' },
  // PaymentModal methods: "💳 Credit/Debit Card", "📱 UPI", "🏦 Net Banking"
  amountPaid:    { type: Number, default: 0 },
}, { _id: false });

// Each session the student has enrolled in via PaymentModal
const enrolledSessionSchema = new mongoose.Schema({
  session:       { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  enrolledAt:    { type: Date, default: Date.now },
  paymentId:     { type: String, default: '' },
  paymentMethod: { type: String, enum: ['card', 'upi', 'net'], default: 'upi' },
  amountPaid:    { type: Number, default: 0 },
}, { _id: false });

// Connection requests sent to alumni
const connectionRequestSchema = new mongoose.Schema({
  alumni:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentAt:  { type: Date, default: Date.now },
  status:  {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    // AlumniCard states: "Connect" → "Pending…" → "✓ Connected"
  },
}, { _id: false });

// ── Student Schema ───────────────────────────────────────────

const studentSchema = new mongoose.Schema({

  // ── Academic Info ──────────────────────────────────────────
  // Collected at Signup Step 2 (college) and profile edit
  // NO cgpa — not present anywhere in the frontend
  year: {
    type: Number,
    min: 1,
    max: 5,
    default: 1,
  },
  branch: {
    type: String,
    default: '',
    // e.g. "Computer Science", "ECE"
  },

  // ── Enrolled Courses ───────────────────────────────────────
  // Populated when student pays via PaymentModal (card/upi/net)
  // Stats card on StudentProfile: "Courses Enrolled: 4"
  // Academics page: used to show which courses are already enrolled
  enrolledCourses: [enrolledCourseSchema],

  // ── Enrolled Sessions ──────────────────────────────────────
  // Populated when student pays via PaymentModal for a live session
  // Stats card on StudentProfile: "Sessions Attended: 10"
  enrolledSessions: [enrolledSessionSchema],

  // ── Connections ────────────────────────────────────────────
  // Student clicks "Connect" on AlumniCard → creates pending request
  // "Pending…" state → "✓ Connected" when alumni accepts
  // Stats card on StudentProfile: "Connections: 25"
  // Stats card on StudentProfile: "Mentors Connected: 8"
  connectionRequests: [connectionRequestSchema],
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',   // Alumni they are connected to
  }],

  // ── Badges / Flags ─────────────────────────────────────────

  // Student's college is a partner college
  // Academics page banner: "Partner College Discount Active — Up to 30% off"
  // CourseCard shows "🏛 Partner" badge for partner college courses
  isCollegePartner: {
    type: Boolean,
    default: false,
  },

  // Student paid platform fee for 24h guaranteed replies from premium alumni
  // StudentProfile: "⚡ Unlock 24h Guaranteed Replies" → "Upgrade Now" button
  has24hReply: {
    type: Boolean,
    default: false,
  },
  replyUnlockExpiresAt: {
    type: Date,
    default: null,
  },
});

// ── Virtuals ─────────────────────────────────────────────────

// Stats shown on StudentProfile stats card
studentSchema.virtual('coursesEnrolledCount').get(function () {
  return this.enrolledCourses.length;
});
studentSchema.virtual('sessionsAttendedCount').get(function () {
  return this.enrolledSessions.length;
});
studentSchema.virtual('connectionsCount').get(function () {
  return this.connections.length;
});

studentSchema.set('toJSON',   { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

// ── Methods ──────────────────────────────────────────────────

// Enroll in a course after payment success
studentSchema.methods.enrollCourse = function ({ courseId, amountPaid, paymentId, paymentMethod }) {
  const alreadyEnrolled = this.enrolledCourses.some(
    ec => ec.course.toString() === courseId.toString()
  );
  if (alreadyEnrolled) throw new Error('Already enrolled in this course');
  this.enrolledCourses.push({ course: courseId, amountPaid, paymentId, paymentMethod });
};

// Enroll in a session after payment success
studentSchema.methods.enrollSession = function ({ sessionId, amountPaid, paymentId, paymentMethod }) {
  const alreadyEnrolled = this.enrolledSessions.some(
    es => es.session.toString() === sessionId.toString()
  );
  if (alreadyEnrolled) throw new Error('Already enrolled in this session');
  this.enrolledSessions.push({ session: sessionId, amountPaid, paymentId, paymentMethod });
};

// Check enrollment status (used to show "Enrolled" state on CourseCard/SessionCard)
studentSchema.methods.isEnrolledInCourse = function (courseId) {
  return this.enrolledCourses.some(ec => ec.course.toString() === courseId.toString());
};
studentSchema.methods.isEnrolledInSession = function (sessionId) {
  return this.enrolledSessions.some(es => es.session.toString() === sessionId.toString());
};

const Student = BaseUser.discriminator('student', studentSchema);

module.exports = Student;