import BaseUser from "../models/BaseUser.js";
import { uploadImage } from "../config/cloudinary.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/alumni
// Query params: college, isPremium, has24h, page, limit
// Used by: Networking page (student) — AlumniCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
export const getAlumni = async (req, res) => {
  try {
    const { college, isPremium, has24h, page = 1, limit = 12 } = req.query;

    const filter = { role: "alumni", status: "active" };

    if (college)   filter.college    = { $regex: college, $options: "i" };
    if (isPremium) filter.alumniPlan = "premium";
    if (has24h)    filter.has24hReply = true;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await BaseUser.countDocuments(filter);
    const alumni = await BaseUser.find(filter)
      .select("name email college company avatar about skills alumniPlan isVerified tokens has24hReply isCollegePartner")
      .skip(skip)
      .limit(Number(limit))
      .sort({ isVerified: -1, tokens: -1 }); // verified + top earners first

    res.json({
      alumni,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/:id
// Used by: AlumniProfile.jsx, ProfileCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const user = await BaseUser.findById(req.params.id)
      .select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/profile
// Body: { name, about, skills[], college?, company?, avatar?(base64), coverPhoto?(base64) }
// Used by: EditProfile.jsx, student/Profile.jsx, alumni/Profile.jsx
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, about, skills, college, company, avatar, coverPhoto } = req.body;

    const updates = {};
    if (name)    updates.name    = name;
    if (about)   updates.about   = about;
    if (skills)  updates.skills  = skills;
    if (college) updates.college = college;
    if (company) updates.company = company;

    // Upload avatar if provided as base64
    if (avatar && avatar.startsWith("data:")) {
      const { url } = await uploadImage(avatar, "connect/avatars");
      updates.avatar = url;
    }

    // Upload cover photo if provided as base64
    if (coverPhoto && coverPhoto.startsWith("data:")) {
      const { url } = await uploadImage(coverPhoto, "connect/covers");
      updates.coverPhoto = url;
    }

    const user = await BaseUser.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/upgrade-plan
// Body: { plan: "premium" }
// Used by: AlumniModelGate.jsx upgrade CTA, Signup step 3
// ─────────────────────────────────────────────────────────────────────────────
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
      req.user.id,
      { alumniPlan: plan },
      { new: true }
    ).select("-password");

    res.json({ message: `Plan upgraded to ${plan}`, user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};