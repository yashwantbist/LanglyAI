import mongoose from "mongoose";
import User from "./User.js";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
      unique: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: null, 
    },
    plan: {
      type: String,
      enum: ["FREE", "A1", "A2", "B1", "B2"],
      default: "FREE",
    },
    status: {
      type: String,
      enum: ["inactive", "active", "past_due", "canceled", "incomplete"],
      default: "inactive",
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
