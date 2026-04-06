const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const baseUserSchema = new mongoose.Schema(
  {
    // ── Core Auth ─────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'alumni', 'admin'],
      required: true,
    },

    // ── Profile (shared across all roles) ─────────────────────
    // EditProfile modal: name, role/position, college, about, skills
    // ProfileCard shows: name, role, college, about, skills, avatar, coverPhoto
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    about: {
      type: String,
      maxlength: [1000, 'About cannot exceed 1000 characters'],
      default: '',
      // Textarea: "Tell students about your experience..."
    },
    avatar: {
      type: String,
      default: '',
      // Camera icon on ProfileCard avatar
    },
    coverPhoto: {
      type: String,
      default: '',
      // Cover photo banner on ProfileCard
    },
    college: {
      type: String,
      default: '',
      // Shown as "🎓 IIT Delhi" on AlumniCard, ProfileCard, AlumniProfile
    },
    skills: [String],
    // ["DSA", "React", "System Design"]
    // Set via EditProfile skills comma-separated input
    // Shown as purple chips on ProfileCard and AlumniProfile → About tab

    // ── Social Links ──────────────────────────────────────────
    linkedin: { type: String, default: '' },
    github:   { type: String, default: '' },

    // ── Account Status ────────────────────────────────────────
    // isVerified: admin clicked "✓ Verify" in /admin/users
    // Shows "✓ Verified Alumni" badge on ProfileCard and AlumniProfile
    isVerified: { type: Boolean, default: false },

    // isActive: false = account deactivated
    isActive: { type: Boolean, default: true },

    // status: what admin sees in Users table
    // Matches statusColors in admin/Users.jsx: active | pending | suspended
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'active',
    },

    lastLogin: { type: Date },
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
  }
);

// ── Hooks ────────────────────────────────────────────────────

baseUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Methods ──────────────────────────────────────────────────

baseUserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

baseUserSchema.methods.toPublicProfile = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  return obj;
};

const BaseUser = mongoose.model('User', baseUserSchema);

module.exports = BaseUser;