import Post from "../models/Post.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/posts
// Query: page, limit
// Used by: Feed.jsx (student + alumni), FeedList.jsx, PostCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
export const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const total = await Post.countDocuments();
    const posts = await Post.find()
      .populate("author", "name avatar role college company alumniPlan isVerified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      posts,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/posts
// Body: { content, media[]?, tags[]? }
// Used by: CreatePost.jsx
// ─────────────────────────────────────────────────────────────────────────────
export const createPost = async (req, res) => {
  try {
    const { content, media, tags } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Post content cannot be empty" });
    }

    const post = await Post.create({
      author:  req.user.id,
      content: content.trim(),
      media:   media  || [],
      tags:    tags   || [],
    });

    // Populate author for immediate frontend use
    await post.populate("author", "name avatar role college company alumniPlan isVerified");

    res.status(201).json({ message: "Post created", post });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/posts/:id/like
// Toggles like — adds if not liked, removes if already liked
// Used by: PostCard.jsx heart button
// ─────────────────────────────────────────────────────────────────────────────
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId   = req.user.id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();

    res.json({
      liked:      !alreadyLiked,
      likesCount: post.likes.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/posts/:id/comment
// Body: { text }
// Used by: PostCard.jsx comment section
// ─────────────────────────────────────────────────────────────────────────────
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = {
      author: req.user.id,
      text:   text.trim(),
    };
    post.comments.push(comment);
    await post.save();

    // Return the populated post
    await post.populate("comments.author", "name avatar role");
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({ message: "Comment added", comment: newComment });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/posts/:id
// Body: { content, media[]?, tags[]? }
// Only the original author can edit — admin cannot edit others' posts
// Sets isEdited: true so frontend can show an "edited" badge if needed
// ─────────────────────────────────────────────────────────────────────────────
export const editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to edit this post" });
    }

    const { content, media, tags } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Post content cannot be empty" });
    }

    post.content  = content.trim();
    post.media    = media ?? post.media;
    post.tags     = tags  ?? post.tags;
    post.isEdited = true;

    await post.save();
    await post.populate("author", "name avatar role college company alumniPlan isVerified");

    res.json({ message: "Post updated", post });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/posts/:id
// Author or admin can delete
// ─────────────────────────────────────────────────────────────────────────────
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isOwner = post.author.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};