import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // important for security
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    currentLevel: {
      type: String,
      enum: ["A1", "A2", "B1", "B2"],
      default: "A1",
    },

    dayStreak: {
      type: Number,
      default: 0,
    },

    totalXP: {
      type: Number,
      default: 0,
    },

    stripeCustomerId: {
      type: String,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
