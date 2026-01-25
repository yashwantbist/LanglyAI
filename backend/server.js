import express from "express";
import passport from "passport";
import session from "express-session";
import cors from "cors";

import connectDB from "./config/database.js";
import authRoutes from "./routes/authroutes.js";
import lessonroutes from "./routes/lessonroutes.js";
import stripeRoutes from "./routes/striperoutes.js";
import voiceRoutes from "./routes/voiceroutes.js";
import translateRoutes from "./routes/translateroutes.js";

import "./config/passport.js";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://3.80.76.25",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  }),
);

//  Webhook must be raw + must be a real handler
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

//  Normal JSON middleware AFTER Stripe
app.use(express.json());
app.use("/api/stripe", stripeRoutes);

// session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboardcat",
    resave: false,
    saveUninitialized: true,
    cookie: {
      sameSite: "lax",
      secure: false, 
    },
  }),
);


app.use(passport.initialize());
app.use(passport.session());

// other routes
app.use("/api/auth", authRoutes);
app.use("/api/lessons", lessonroutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/translate", translateRoutes);

app.get("/", (req, res) => res.send("LanglyAI API running..."));

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
