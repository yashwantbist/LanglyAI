import "dotenv/config";
import express from "express";
import passport from "passport";
import session from "express-session";
import cors from "cors";

import connectDB from "./config/database.js";
import authRoutes from "./routes/authroutes.js";
import lessonRoutes from "./routes/lessonroutes.js";
import stripeRoutes, {
  stripeWebhook,
} from "./routes/striperoutes.js";
import voiceRoutes from "./routes/voiceroutes.js";
import translateRoutes from "./routes/translateroutes.js";

import "./config/passport.js";

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://langlyai.com",
  "https://www.langlyai.com",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Not allowed by CORS: ${origin}`),
      );
    },
    credentials: true,
  }),
);

/*
 * Webhook must be registered before express.json().
 */
app.post(
  "/api/stripe/webhook",
  express.raw({
    type: "application/json",
  }),
  stripeWebhook,
);

/*
 * Parse every other request as JSON.
 */
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

/*
 * All routes must be before the 404 handler.
 */
app.use("/api/auth", authRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/translate", translateRoutes);

app.get("/", (req, res) => {
  res.send("LanglyAI API running...");
});

/*
 * This must be after all API routes.
 */
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  return res.status(500).json({
    message: "Internal server error",
  });
});

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server running on port ${PORT}`,
    );
  });
}

startServer().catch((error) => {
  console.error(
    "Failed to start server:",
    error,
  );

  process.exit(1);
});