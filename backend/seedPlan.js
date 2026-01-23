import "dotenv/config";
import mongoose from "mongoose";
import Plan from "./models/Plan.js";

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // ✅ drop bad legacy index if it exists
    const indexes = await Plan.collection.indexes();
    const hasBadIndex = indexes.some((i) => i.name === "planeName_1");
    if (hasBadIndex) {
      console.log("🧹 Dropping bad index planeName_1...");
      await Plan.collection.dropIndex("planeName_1");
    }

    await Plan.deleteMany({});
    await Plan.insertMany([
      { name: "A1", amount: 999, billingInterval: "month", stripePriceId: "price_1SpJG9PqoLVhS1r2wHlCjhfl" },
      { name: "A2", amount: 1499, billingInterval: "month", stripePriceId: "price_1SpJIBPqoLVhS1r2IWDNKrkQ" },
      { name: "B1", amount: 1999, billingInterval: "month", stripePriceId: "price_1SpJJBPqoLVhS1r27c06vbTc" },
      { name: "B2", amount: 2499, billingInterval: "month", stripePriceId: "price_1SpJK0PqoLVhS1r2nNry7MLP" },
    ]);

    console.log("✅ Plans seeded");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();
