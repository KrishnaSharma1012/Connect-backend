import Earning from "../models/Earning.js";

// ─────────────────────────────
// GET MY EARNINGS
// ─────────────────────────────
export const getMyEarnings = async (req, res) => {
  try {
    const earnings = await Earning.find({ alumni: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ earnings });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────
// GET EARNING STATS
// ─────────────────────────────
export const getEarningStats = async (req, res) => {
  try {
    const earnings = await Earning.find({ alumni: req.user._id });

    const total = earnings.reduce((sum, e) => sum + e.grossAmount, 0);
    const platformFee = earnings.reduce((sum, e) => sum + e.platformFee, 0);
    const net = total - platformFee;

    res.json({
      totalEarnings: total,
      platformFee,
      netEarnings: net,
      totalTransactions: earnings.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────
// REQUEST WITHDRAWAL
// ─────────────────────────────
export const requestWithdrawal = async (req, res) => {
  try {
    // ⚠️ Dummy logic (you can integrate Razorpay later)
    res.json({ message: "Withdrawal request submitted (manual process)" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};