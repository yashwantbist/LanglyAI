import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ["A1", "A2", "B1", "B2"],
    required: true,
    unique: true,
  },
 stripePriceId: { type: String, required: true, amount: Number, },
  
  billingInterval: { type: String, default: "month" },
}, { timestamps: true });

export default mongoose.model("Plan", planSchema);
