import mongoose from "mongoose";
import dotenv from "dotenv";
import Lessonai from "./models/Lessonai.js";
import { lessonsData } from "./data/lessonsData.js"; // ✅ likely correct path if script is in backend root

dotenv.config();

async function seedLessons() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Mongo connected for seeding");

  let inserted = 0;
  let updatedTitles = 0;
  let skipped = 0;

  for (const l of lessonsData) {
    const level = l.level.toUpperCase();
    const dayNumber = Number(l.dayNumber);

    if (!level || Number.isNaN(dayNumber) || !l.title) {
      console.log("⚠️ Skipping invalid item:", l);
      skipped++;
      continue;
    }

    const existing = await Lessonai.findOne({ level, dayNumber });

    if (!existing) {
      await Lessonai.create({ level, dayNumber, title: l.title });
      inserted++;
    } else {
      // ✅ do NOT overwrite aiContent; only fix missing/wrong title
      if (!existing.title || existing.title !== l.title) {
        existing.title = l.title;
        await existing.save();
        updatedTitles++;
      } else {
        skipped++;
      }
    }
  }

  console.log("🎉 Seed complete");
  console.log("Inserted:", inserted);
  console.log("Updated titles:", updatedTitles);
  console.log("Skipped:", skipped);

  await mongoose.disconnect();
  process.exit(0);
}

seedLessons().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
