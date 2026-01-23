import express from "express";
import OpenAI from "openai";
import Ajv from "ajv";

import Lessonai from "../models/Lessonai.js";
import LessonProgress from "../models/LessonProgress.js";

import { lessonsData } from "../data/lessonsData.js";
import { blueprints } from "../data/blueprint.js";
import { lessonJsonSchema } from "../data/lessonJsonSchema.js";
import { requireLevelAccess } from "../middleware/requireSubscription.js";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPT_VERSION = 2; // ✅ only here

// AJV validator
const ajv = new Ajv({ allErrors: true });
const validateAI = ajv.compile(lessonJsonSchema.schema);

// progress route
router.get("/progress/:userId", async (req, res) => {
  const { userId } = req.params;
  const { level } = req.query;

  const progress = await LessonProgress.find({
    user: userId,
    level,
    completed: true,
  });

  res.json(progress);
});

// meta route must be BEFORE "/:level"
router.get("/meta/levels", async (req, res) => {
  const levels = await Lessonai.distinct("level");
  res.json(levels.sort());
});

// mark complete
router.post("/progress", async (req, res) => {
  const { userId, level, dayNumber, score, accuracy, timeSpent } = req.body;

  const progress = await LessonProgress.findOneAndUpdate(
    { user: userId, level, dayNumber },
    {
      completed: true,
      score,
      accuracy,
      timeSpent,
      completedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  res.json(progress);
});

// get lesson by level + day
router.get("/:level/:dayNumber",requireLevelAccess, async (req, res) => {
  try {
    const level = req.params.level.toUpperCase();
    const day = Number(req.params.dayNumber);

    if (Number.isNaN(day)) {
      return res.status(400).json({ message: "Invalid dayNumber" });
    }

    let lesson = await Lessonai.findOne({ level, dayNumber: day });

    if (!lesson) {
      const meta = lessonsData.find((l) => l.level === level && l.dayNumber === day);
      const title = meta?.title || `Lesson ${day} for ${level}`;
      lesson = await Lessonai.create({ level, dayNumber: day, title });
    }

    // ✅ needsGen checks renderMarkdown + promptVersion
    const needsGen =
      !lesson.aiContent?.renderMarkdown?.fr ||
      !lesson.aiContent?.renderMarkdown?.en ||
      !lesson.aiContent?.explanation?.short?.fr ||
      !lesson.aiContent?.explanation?.short?.en ||
      !lesson.aiContent?.examples?.length ||
      lesson.aiContent?.promptVersion !== PROMPT_VERSION;

    if (!needsGen) return res.json(lesson);

    const bp = blueprints[lesson.title];

    const system = `
You are a CEFR-aligned French curriculum writer.
You must produce EXACTLY the JSON schema requested.
Avoid vague text. Use concrete examples that match the title.
French language level must match CEFR ${level}.
`;

    const user = `
Create a structured French lesson:

Level: ${level}
Day: ${day}
Title: "${lesson.title}"

Blueprint (follow strictly if present):
${bp ? JSON.stringify(bp) : "No blueprint"}

Hard rules:
- explanation.short: 3–5 lines (clear + practical)
- explanation.detailed: 10–14 lines (step-by-step)
- keyPoints: 4–6 (each with FR+EN example)
- examples: 6–8 (FR+EN+notes)
- exercises: 6–8 (include ANSWERS)
- miniQuiz: 3–5 (choices must be 4, correctIndex valid)
- tips: 1 short actionable tip

Language rules:
- Provide BOTH French (fr) and English (en) for every bilingual field.
- French text must be natural French for CEFR ${level}.
- English text must be natural native English, not a literal translation.
- Keep FR and EN meaning equivalent.
renderMarkdown rules:
- renderMarkdown.fr must be at least 500 words and include:
  1) Objective
  2) Explanation (short + detailed summary)
  3) Key Points (bulleted)
  4) Examples (bulleted)
  5) Exercises with answers
  6) Mini quiz with answers
- Same for renderMarkdown.en

`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system.trim() },
        { role: "user", content: user.trim() },
      ],
      response_format: { type: "json_schema", json_schema: lessonJsonSchema },
      temperature: 0.25,
      max_tokens: 3500,
    });

    const raw = response.choices?.[0]?.message?.content;

    let aiContent;
    try {
      aiContent = JSON.parse(raw);
    } catch (e) {
      console.error("AI JSON PARSE ERROR:", e);
      return res.status(500).json({ message: "AI returned invalid JSON", raw });
    }

    const ok = validateAI(aiContent);
    if (!ok) {
      return res.status(500).json({
        message: "AI returned JSON but failed schema validation",
        errors: validateAI.errors,
        aiContent,
      });
    }

    lesson.aiContent = {
      ...aiContent,
      updatedAt: new Date(),
      model: "gpt-4o-mini",
      promptVersion: PROMPT_VERSION,
    };

    await lesson.save();
    return res.json(lesson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch/generate lesson", error: err.message });
  }
});

// get lessons by level (Dashboard)
router.get("/:level", async (req, res) => {
  try {
    const level = req.params.level.toUpperCase();
    const lessons = await Lessonai.find({ level }).sort({ dayNumber: 1 });
    res.json(lessons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch lessons" });
  }
});

export default router;
