import mongoose from "mongoose";

const BilingualText = {
  fr: { type: String, required: true },
  en: { type: String, required: true },
};

const lessonSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ["A1", "A2", "B1", "B2"], required: true },
    dayNumber: { type: Number, required: true },
    title: { type: String, required: true },

    aiContent: {
      objective: BilingualText,

      grammarFocus: [
        {
          fr: { type: String, required: true },
          en: { type: String, required: true },
        },
      ],

      vocabTheme: [
        {
          fr: { type: String, required: true },
          en: { type: String, required: true },
        },
      ],

      explanation: {
        short: BilingualText,
        detailed: BilingualText,
      },

      keyPoints: [
        {
          point: BilingualText,
          exampleFr: { type: String, required: true },
          exampleEn: { type: String, required: true },
        },
      ],

      examples: [
        {
          fr: { type: String, required: true },
          en: { type: String, required: true },
          notes: BilingualText,
        },
      ],

      exercises: [
        {
          type: { type: String, enum: ["fill_blank", "translate", "short_answer"], required: true },
          prompt: BilingualText,
          answer: BilingualText,
        },
      ],

      miniQuiz: [
        {
          question: BilingualText,
          choices: [
            {
              fr: { type: String, required: true },
              en: { type: String, required: true },
            },
          ],
          correctIndex: { type: Number, required: true },
          explanation: BilingualText,
        },
      ],

      tips: BilingualText,

      renderMarkdown: BilingualText,

      updatedAt: Date,
      model: String,
      promptVersion: Number,
    },
  },
  { timestamps: true }
);

lessonSchema.index({ level: 1, dayNumber: 1 }, { unique: true });

export default mongoose.model("Lessonai", lessonSchema);
