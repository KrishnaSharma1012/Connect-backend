import express from "express";
import {
  getPosts,
  createPost,
  editPost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
} from "../controllers/post.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

// ✅ apply once
router.use(protect);

// ─────────────────────────────
// POSTS
// ─────────────────────────────
router.get("/", getPosts);
router.post("/", createPost);

router.put("/:id", editPost);
router.delete("/:id", deletePost);

router.post("/:id/like", toggleLike);

// ❗ FIX (comments → comment)
router.post("/:id/comment", addComment);

// ❗ FIX (param names must match controller)
router.delete("/:postId/comment/:commentId", deleteComment);

export default router;