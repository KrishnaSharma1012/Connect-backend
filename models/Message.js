const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // ── Participants ───────────────────────────────────────────
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Content ───────────────────────────────────────────────
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      // ChatBox input → send button
    },

    // ── Read Status ───────────────────────────────────────────
    // ConversationList shows unread messages
    // ChatWindow marks as read when opened
    isRead: { type: Boolean, default: false },

    // ── Conversation ID ───────────────────────────────────────
    // Generated as sorted [userId1, userId2].join('_')
    // Same ID regardless of who sends first
    // Used by: ConversationList, ChatWindow, ChatBox
    // Also used for token calculation:
    //   When alumni replies, check time since student's last message
    //   If reply within 2h → +5 tokens
    //   If reply within 4h → +3 tokens
    conversationId: { type: String, required: true },

    // ── Timestamp ─────────────────────────────────────────────
    // Used to calculate reply speed for token system
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────
// Fast lookup for conversation messages (ChatWindow)
messageSchema.index({ conversationId: 1, createdAt: -1 });
// Fast lookup for unread messages (ConversationList badge)
messageSchema.index({ receiver: 1, isRead: 1 });

// ── Statics ──────────────────────────────────────────────────

// Generate consistent conversation ID from any two user IDs
// getConversationId(A, B) === getConversationId(B, A)
messageSchema.statics.getConversationId = function (userId1, userId2) {
  return [userId1.toString(), userId2.toString()].sort().join('_');
};

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;