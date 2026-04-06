const mongoose = require('mongoose');

// PostCard supports both single image (legacy) and multi-file media grid
const mediaSchema = new mongoose.Schema({
  url:  { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], default: 'image' },
  // PostCard: images in 2-column grid, videos with controls
}, { _id: false });

// Inline comment section on PostCard
const commentSchema = new mongoose.Schema({
  author:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 500,
  },
}, { timestamps: true });

const postSchema = new mongoose.Schema(
  {
    // ── Author ────────────────────────────────────────────────
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // PostCard shows author badges: verified, has24h, isPremium
    // These come from populating the author ref

    // ── Content ───────────────────────────────────────────────
    content: {
      type: String,
      required: [true, 'Post content is required'],
      maxlength: [1000, 'Post content cannot exceed 1000 characters'],
    },

    // ── Media ─────────────────────────────────────────────────
    // Legacy single image (still supported by PostCard)
    image: { type: String, default: '' },

    // New multi-file media grid (PostCard: gridTemplateColumns: "repeat(2, 1fr)")
    // Images show at 160px height in grid, solo image at 280px
    // Videos show at 280px with controls
    media: [mediaSchema],

    // ── Feed Filtering ────────────────────────────────────────
    // Feed filter tabs: "All" | "Alumni" | "Trending" | "Sessions"
    tags: [String],
    // e.g. ["alumni", "trending", "sessions"]

    // ── Engagement ────────────────────────────────────────────
    // PostCard heart button: liked state toggles like/unlike
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // PostCard inline comment section with input + "Post" button
    comments: [commentSchema],

    // ── Visibility ────────────────────────────────────────────
    // Admin can hide flagged content (from admin Dashboard recent activity)
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Virtuals ─────────────────────────────────────────────────

// PostCard displays likes count next to heart
postSchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

// PostCard: "Comment (3)"
postSchema.virtual('commentsCount').get(function () {
  return this.comments.length;
});

postSchema.set('toJSON',   { virtuals: true });
postSchema.set('toObject', { virtuals: true });

// ── Indexes ──────────────────────────────────────────────────
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;