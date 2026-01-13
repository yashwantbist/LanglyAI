import dotenv from "dotenv";
dotenv.config(); 


import express from "express";
import passport from "passport";
import session from "express-session";
import cors from "cors";

import connectDB from "./config/database.js";
import "./config/passport.js"; // passport after dotenv
import authRoutes from "./routes/authroutes.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboardcat",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => res.send("🚀 LanglyAI API running..."));

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
