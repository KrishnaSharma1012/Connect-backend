import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/database.js"; // ✅ FIX
import dotenv from "dotenv";

dotenv.config();

// ── DB ─────────────────────────────────────
connectDB();

// ── Routes (FIXED NAMES) ───────────────────
import authRoutes       from "./routes/Auth.js";
import userRoutes       from "./routes/User.js";
import postRoutes       from "./routes/Post.js";
import courseRoutes     from "./routes/Course.js";
import sessionRoutes    from "./routes/Session.js";
import messageRoutes    from "./routes/Message.js";
import connectionRoutes from "./routes/Connection.js";
import earningRoutes    from "./routes/Earning.js";
import adminRoutes      from "./routes/Admin.js";

const app = express();

// ── Middleware ─────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── API Routes ─────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/earnings", earningRoutes);
app.use("/api/admin", adminRoutes);

// ── Health check ───────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ── 404 ────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ── Global Error Handler ───────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

// ── Start Server ───────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});