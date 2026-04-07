import BaseUser from "../models/BaseUser.js";
import { uploadImage } from "../config/cloudinary.js";

// ─────────────────────────────────────────────
// GET ALUMNI
// ─────────────────────────────────────────────
export const getAlumni = async (req, res) => {
  try {
    const { college, isPremium, has24h, page = 1, limit = 12 } = req.query;

    const filter = { role: "alumni", status: "active" };

    if (college) filter.college = { $regex: college, $options: "i" };
    if (isPremium === "true") filter.alumniPlan = "premium"; // ✅ FIX
    if (has24h === "true") filter.has24hReply = true; // ✅ FIX

    const skip = (Number(page) - 1) * Number(limit);
    const total = await BaseUser.countDocuments(filter);

    const alumni = await BaseUser.find(filter)
      .select(
        "name email college company avatar about skills alumniPlan isVerified tokens has24hReply isCollegePartner"
      )
      .skip(skip)
      .limit(Number(limit))
      .sort({ isVerified: -1, tokens: -1 });

    res.json({
      alumni,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET USER BY ID
// ─────────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const user = await BaseUser.findById(req.params.id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, about, skills, college, company, avatar, coverPhoto } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (about) updates.about = about;
    if (skills) updates.skills = skills;
    if (college) updates.college = college;
    if (company) updates.company = company;

    // avatar upload
    if (avatar && avatar.startsWith("data:")) {
      const { url } = await uploadImage(avatar, "avatars");
      updates.avatar = url;
    }

    // cover upload
    if (coverPhoto && coverPhoto.startsWith("data:")) {
      const { url } = await uploadImage(coverPhoto, "covers");
      updates.coverPhoto = url;
    }

    const user = await BaseUser.findByIdAndUpdate(
      req.user._id, // ✅ FIX
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// ❗ NEW: UPLOAD AVATAR (MISSING)
// ─────────────────────────────────────────────
export const uploadAvatar = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const { url } = await uploadImage(image, "avatars");

    const user = await BaseUser.findByIdAndUpdate(
      req.user._id,
      { avatar: url },
      { new: true }
    ).select("-password");

    res.json({ message: "Avatar uploaded", avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// UPGRADE PLAN
// ─────────────────────────────────────────────
export const upgradePlan = async (req, res) => {
  try {
    if (req.user.role !== "alumni") {
      return res.status(403).json({ message: "Only alumni can upgrade plans" });
    }

    const { plan } = req.body;

    if (!["simple", "premium"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const user = await BaseUser.findByIdAndUpdate(
      req.user._id, // ✅ FIX
      { alumniPlan: plan },
      { new: true }
    ).select("-password");

    res.json({ message: `Plan upgraded to ${plan}`, user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};