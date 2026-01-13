import mongoose from "mongoose";

const lessonProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2"],
      required: true,
    },

    dayNumber: {
      type: Number, // 1 → 120
      required: true,
    },

    lessonId: {
      type: String,
      required: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    score: {
      type: Number, // 0–100
      min: 0,
      max: 100,
    },

    accuracy: {
      type: Number, // %
      min: 0,
      max: 100,
    },

    timeSpent: {
      type: Number, // seconds
      default: 0,
    },

    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Prevent duplicate progress for same lesson/day
lessonProgressSchema.index(
  { user: 1, level: 1, dayNumber: 1 },
  { unique: true }
);

export default mongoose.model("LessonProgress", lessonProgressSchema);
