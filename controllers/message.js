import Message from "../models/Message.js";
import BaseUser from "../models/BaseUser.js";

// Token rules
const TOKENS = {
  REPLY_2H: 5,
  REPLY_4H: 3,
};

// ─────────────────────────────────────────────
// GET CONVERSATIONS
// ─────────────────────────────────────────────
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$content" }, // ✅ FIX (text → content)
          lastTime: { $first: "$createdAt" },
          unread: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userId] },
                    { $eq: ["$read", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastTime: -1 } },
    ]);

    const populated = await BaseUser.populate(conversations, {
      path: "_id",
      select: "name avatar role college company alumniPlan isVerified",
    });

    const result = populated.map((c) => ({
      partner: c._id,
      lastMessage: c.lastMessage,
      lastTime: c.lastTime,
      unread: c.unread,
    }));

    res.json({ conversations: result });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET MESSAGES
// ─────────────────────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = req.user._id; // ✅ FIX

    const messages = await Message.find({
      $or: [
        { sender: me, receiver: userId },
        { sender: userId, receiver: me },
      ],
    })
      .populate("sender", "name avatar role")
      .populate("receiver", "name avatar role")
      .sort({ createdAt: 1 });

    // mark as read
    await Message.updateMany(
      { sender: userId, receiver: me, read: false },
      { read: true }
    );

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;
    const me = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const message = await Message.create({
      sender: me,
      receiver: userId,
      content: content.trim(),
    });

    await message.populate("sender", "name avatar role");
    await message.populate("receiver", "name avatar role");

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────
// ❗ MARK AS READ (MISSING)
// ─────────────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = req.user._id;

    await Message.updateMany(
      { sender: userId, receiver: me, read: false },
      { read: true }
    );

    res.json({ message: "Messages marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};