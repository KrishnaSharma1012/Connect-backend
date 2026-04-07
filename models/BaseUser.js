import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,

  role: {
    type: String,
    enum: ["student", "alumni", "admin"],
    default: "student",
  },

  avatar: String,
  coverPhoto: String,
  about: String,
  skills: [String],

  college: String,
  company: String,

  alumniPlan: {
    type: String,
    enum: ["simple", "premium"],
    default: "simple",
  },

  tokens: { type: Number, default: 0 },

  isVerified: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },

  has24hReply: { type: Boolean, default: false },
  isCollegePartner: { type: Boolean, default: false },

}, { timestamps: true });

const BaseUser = mongoose.model("BaseUser", userSchema);

export default BaseUser;