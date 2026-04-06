import express from "express";
import {
  getPosts,
  createPost,
  editPost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
} from "../controllers/post.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",                        protect, getPosts);
router.post("/",                       protect, createPost);
router.put("/:id",                     protect, editPost);
router.delete("/:id",                  protect, deletePost);
router.post("/:id/like",               protect, toggleLike);
router.post("/:id/comments",           protect, addComment);
router.delete("/:id/comments/:commentId", protect, deleteComment);

export default router;