import Message from "../models/Message.js";
import BaseUser from "../models/BaseUser.js";

// Token rules (from Earnings.jsx TOKEN_ACTIVITY and frontend analysis)
const TOKENS = {
  REPLY_2H: 5,   // replied within 2 hours
  REPLY_4H: 3,   // replied within 4 hours
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/conversations
// Returns list of unique conversations for the logged-in user
// Used by: ConversationList.jsx, Messages.jsx (student + alumni)
// ─────────────────────────────────────────────────────────────────────────────
export const getConversations = async (req, res) => {
  try {
    // Get the last message per conversation partner
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: req.user._id }, { receiver: req.user._id }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", req.user._id] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$text" },
          lastTime:    { $first: "$createdAt" },
          unread:      {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$receiver", req.user._id] }, { $eq: ["$read", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastTime: -1 } },
    ]);

    // Populate partner details
    const populated = await BaseUser.populate(conversations, {
      path: "_id",
      select: "name avatar role college company alumniPlan isVerified",
    });

    const result = populated.map((c) => ({
      partner:     c._id,
      lastMessage: c.lastMessage,
      lastTime:    c.lastTime,
      unread:      c.unread,
    }));

    res.json({ conversations: result });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/:userId
// Returns full message thread between current user and :userId
// Used by: ChatWindow.jsx
// ─────────────────────────────────────────────────────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: me,     receiver: userId },
        { sender: userId, receiver: me     },
      ],
    })
      .populate("sender",   "name avatar role")
      .populate("receiver", "name avatar role")
      .sort({ createdAt: 1 });

    // Mark incoming messages as read
    await Message.updateMany(
      { sender: userId, receiver: me, read: false },
      { read: true }
    );

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/messages/:userId
// Body: { text }
// Sends a message from current user → :userId
// Token logic:
//   If an alumni replies to a student and the student's last message
//   was sent within 2h → alumni gets +5 tokens
//   If within 4h → alumni gets +3 tokens
// Used by: ChatWindow.jsx send button
// ─────────────────────────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;  // receiver
    const { text }   = req.body;
    const me         = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const message = await Message.create({
      sender:   me,
      receiver: userId,
      text:     text.trim(),
    });

    await message.populate("sender",   "name avatar role");
    await message.populate("receiver", "name avatar role");

    // ── Token Speed Reward (alumni replying to student messages) ───────────
    // Check if the sender is alumni and receiver is student
    const sender = await BaseUser.findById(me);
    if (sender?.role === "alumni") {
      // Find the most recent message from the student (receiver in this context)
      const lastStudentMsg = await Message.findOne({
        sender:   userId,
        receiver: me,
      }).sort({ createdAt: -1 });

      if (lastStudentMsg) {
        const minutesSince = (Date.now() - new Date(lastStudentMsg.createdAt)) / 60000;
        let tokensEarned = 0;

        if (minutesSince <= 120) {       // within 2 hours
          tokensEarned = TOKENS.REPLY_2H;
        } else if (minutesSince <= 240) { // within 4 hours
          tokensEarned = TOKENS.REPLY_4H;
        }

        if (tokensEarned > 0) {
          await BaseUser.findByIdAndUpdate(me, { $inc: { tokens: tokensEarned } });
        }
      }
    }

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};