import mongoose from "mongoose";
const BaseUser = require('./BaseUser');

// ── Sub-schemas ──────────────────────────────────────────────

// Token activity log — shown on Earnings page → "Token Activity" tab
const tokenActivitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    // e.g. "Replied within 2h to Priya"
    // e.g. "Session completed: React WS"
    // e.g. "Replied within 4h to Arjun"
  },
  tokens: {
    type: Number,
    required: true,
    // Positive = earned, Negative = redeemed
  },
  relatedUser:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    default: null },
  relatedSession: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
}, { timestamps: true });

// Earnings transaction — shown on Earnings page → "Recent Transactions" table
const earningsTransactionSchema = new mongoose.Schema({
  title:       String,   // "System Design Session", "React Workshop"
  amount:      Number,   // total paid by students
  yourShare:   Number,   // 80% — what alumni keeps
  platformFee: Number,   // 20% — what Connect takes
  students:    Number,   // how many students enrolled
  type: {
    type: String,
    enum: ['session', 'workshop', 'course', 'mentorship'],
    default: 'session',
    // Matches typeColors in Earnings.jsx: session | workshop | course | mentorship
  },
  relatedSession: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  relatedCourse:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
}, { timestamps: true });

// Connection requests from students
const connectionRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentAt:  { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
}, { _id: false });

// ── Alumni Schema ────────────────────────────────────────────

const alumniSchema = new mongoose.Schema({

  // ── Plan ──────────────────────────────────────────────────
  // Chosen at Signup Step 3 "Choose your plan"
  //
  // simple (Free — forever):
  //   ✓ Post in community feed
  //   ✓ Connect & reply to students
  //   ✓ Earn tokens for fast replies 🪙
  //   ✓ Build profile & reputation
  //
  // premium (₹999/month):
  //   ✓ Everything in Simple
  //   ✓ Upload courses & workshops
  //   ✓ Host live sessions (set your fee)
  //   ✓ Keep 80% of all revenue
  //   ✓ College campus hosting + extra pay
  //   ✓ Featured profile in search
  //
  // AlumniModelGate checks: user?.alumniPlan === "premium"
  // to gate Sessions, Earnings features
  alumniPlan: {
    type: String,
    enum: ['simple', 'premium'],
    default: 'simple',
  },
  planUpgradedAt: {
    type: Date,
    default: null,
  },

  // ── Profile ───────────────────────────────────────────────
  // company collected at Signup Step 2
  // position set via EditProfile "Role / Position" field
  // Combined shown as: "Software Engineer @ Google" on AlumniCard
  company:        { type: String, default: '' },
  position:       { type: String, default: '' },
  expertise:      [String],
  // e.g. ["DSA", "System Design", "React"]
  // Shown on AlumniProfile → About tab → Skills section
  graduationYear: { type: Number },

  // ── Verification & Admin Approval ─────────────────────────
  // Admin clicks "✓ Verify" in /admin/users → sets isVerified=true on BaseUser
  // isApproved = admin has approved this alumni to appear in networking/search
  isApproved: {
    type: Boolean,
    default: false,
  },

  // ── 24h Reply Badge ───────────────────────────────────────
  // Shown as "⚡ 24h Reply" badge on:
  //   - AlumniCard in Networking page
  //   - AlumniProfile header
  //   - PostCard in Feed (has24h prop)
  // Networking page "⚡ 24h Reply" toggle filter uses this
  // Alumni earns this based on consistent fast token responses
  has24hReply: {
    type: Boolean,
    default: false,
  },

  // ── Connections ───────────────────────────────────────────
  // Students send connect requests from AlumniCard / AlumniProfile
  // Once accepted → both sides can message each other
  connectionRequests: [connectionRequestSchema],
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',   // Students connected to this alumni
  }],

  // ── Token System ──────────────────────────────────────────
  // Available to BOTH simple and premium alumni
  // "Earn tokens for fast replies 🪙" is listed on Simple plan too
  //
  // How tokens are earned (from Token Activity tab explanation in Earnings.jsx):
  //   Reply within 2h to connected student → +5 tokens
  //   Reply within 4h to connected student → +3 tokens
  //   Complete a session                   → +20 tokens
  //
  // Earnings page header shows: "🪙 Total Tokens: 248"
  // "Token Activity" tab shows full activity log
  tokens: {
    total:    { type: Number, default: 0 },   // lifetime tokens earned
    current:  { type: Number, default: 0 },   // current spendable balance
    redeemed: { type: Number, default: 0 },   // total redeemed so far
    activity: [tokenActivitySchema],          // full log shown in UI
  },

  // ── Earnings (Premium only) ───────────────────────────────
  // Platform takes 20% commission on ALL session/course/workshop revenue
  // Alumni keeps 80%
  //
  // Earnings page stats:
  //   "Total Earnings: ₹45,000"
  //   "This Month: ₹8,500"
  //   "Sessions Taken: 32"
  //   "Tokens Earned: 248"
  //
  // Sessions page notice:
  //   "Platform takes 20% of session revenue. You keep 80%"
  //
  // Live preview in Create Session modal:
  //   "At ₹999/student · Your share: ₹799 per enrollment"
  earnings: {
    total:            { type: Number, default: 0 },  // gross revenue from all content
    pending:          { type: Number, default: 0 },  // 80% awaiting payout
    withdrawn:        { type: Number, default: 0 },  // already paid out
    platformFeeTotal: { type: Number, default: 0 },  // 20% kept by Connect
    transactions:     [earningsTransactionSchema],   // full history in Recent Transactions
  },

  // ── Content Created (Premium only) ────────────────────────
  // Alumni creates sessions via "Create Session" modal on Sessions page
  // Type selector: "Session", "Workshop", "Course"
  // Admin must approve before visible to students
  coursesCreated:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course'  }],
  sessionsCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],

  // ── Rating ────────────────────────────────────────────────
  // Shown on AlumniProfile stats bar: "Rating: 4.8⭐"
  // Shown on AlumniProfile → Reviews tab (star ratings from students)
  rating: {
    average: { type: Number, default: 0 },
    count:   { type: Number, default: 0 },
  },
});

// ── Methods ──────────────────────────────────────────────────

alumniSchema.methods.isPremium = function () {
  return this.alumniPlan === 'premium';
};

alumniSchema.methods.upgradeToPremium = function () {
  this.alumniPlan = 'premium';
  this.planUpgradedAt = new Date();
};

// Add earning after a student enrolls in session/course
// Platform: 20% | Alumni: 80%
alumniSchema.methods.addEarning = function ({
  title, totalAmount, students, type, relatedSession, relatedCourse,
}) {
  const yourShare   = Math.round(totalAmount * 0.8);
  const platformFee = Math.round(totalAmount * 0.2);
  this.earnings.total            += totalAmount;
  this.earnings.pending          += yourShare;
  this.earnings.platformFeeTotal += platformFee;
  this.earnings.transactions.push({
    title, amount: totalAmount, yourShare, platformFee,
    students, type, relatedSession, relatedCourse,
  });
};

// Add tokens earned for fast replies or completing sessions
alumniSchema.methods.addTokens = function ({
  action, tokens, relatedUser = null, relatedSession = null,
}) {
  this.tokens.total   += tokens;
  this.tokens.current += tokens;
  this.tokens.activity.push({ action, tokens, relatedUser, relatedSession });
};

// Redeem tokens for platform benefits
alumniSchema.methods.redeemTokens = function (amount, action) {
  if (this.tokens.current < amount) throw new Error('Insufficient tokens');
  this.tokens.current  -= amount;
  this.tokens.redeemed += amount;
  this.tokens.activity.push({ action, tokens: -amount });
};

// Available payout balance
alumniSchema.methods.availablePayout = function () {
  return this.earnings.pending - this.earnings.withdrawn;
};

const Alumni = BaseUser.discriminator('alumni', alumniSchema);

export default Alumni;