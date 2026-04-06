import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

// Routes
import authRoutes       from "./routes/auth.routes.js";
import userRoutes       from "./routes/user.routes.js";
import postRoutes       from "./routes/post.routes.js";
import courseRoutes     from "./routes/course.routes.js";
import sessionRoutes    from "./routes/session.routes.js";
import messageRoutes    from "./routes/message.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import earningRoutes    from "./routes/earning.routes.js";
import adminRoutes      from "./routes/admin.routes.js";

dotenv.config();

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── DB ──────────────────────────────────────────────────────
connectDB();

// ── API Routes ──────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/users",       userRoutes);
app.use("/api/posts",       postRoutes);
app.use("/api/courses",     courseRoutes);
app.use("/api/sessions",    sessionRoutes);
app.use("/api/messages",    messageRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/earnings",    earningRoutes);
app.use("/api/admin",       adminRoutes);

// ── Health check ────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ── 404 catch-all ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});