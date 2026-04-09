import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import connectDB from "./config/database.js";

// routes
import authRoutes from "./routes/Auth.js";
import userRoutes from "./routes/User.js";
import postRoutes from "./routes/Post.js";
import courseRoutes from "./routes/Course.js";
import sessionRoutes from "./routes/Session.js";
import messageRoutes from "./routes/Message.js";
import connectionRoutes from "./routes/Connection.js";
import earningRoutes from "./routes/Earning.js";
import adminRoutes from "./routes/Admin.js";

dotenv.config();

const app = express();

// middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// DB
connectDB();

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/earnings", earningRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));