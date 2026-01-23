export const lessonJsonSchema = {
  name: "lesson_ai_content_bilingual",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "objective",
      "grammarFocus",
      "vocabTheme",
      "explanation",
      "keyPoints",
      "examples",
      "exercises",
      "miniQuiz",
      "tips",
      "renderMarkdown"
    ],
    properties: {
      objective: {
        type: "object",
        additionalProperties: false,
        required: ["fr", "en"],
        properties: { fr: { type: "string" }, en: { type: "string" } },
      },

      grammarFocus: {
        type: "array",
        minItems: 2,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["fr", "en"],
          properties: { fr: { type: "string" }, en: { type: "string" } },
        },
      },

      vocabTheme: {
        type: "array",
        minItems: 4,
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["fr", "en"],
          properties: { fr: { type: "string" }, en: { type: "string" } },
        },
      },

      explanation: {
        type: "object",
        additionalProperties: false,
        required: ["short", "detailed"],
        properties: {
          short: {
            type: "object",
            additionalProperties: false,
            required: ["fr", "en"],
            properties: { fr: { type: "string" }, en: { type: "string" } },
          },
          detailed: {
            type: "object",
            additionalProperties: false,
            required: ["fr", "en"],
            properties: { fr: { type: "string" }, en: { type: "string" } },
          },
        },
      },

      keyPoints: {
        type: "array",
        minItems: 4,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["point", "exampleFr", "exampleEn"],
          properties: {
            point: {
              type: "object",
              additionalProperties: false,
              required: ["fr", "en"],
              properties: { fr: { type: "string" }, en: { type: "string" } },
            },
            exampleFr: { type: "string" },
            exampleEn: { type: "string" },
          },
        },
      },

      examples: {
        type: "array",
        minItems: 6,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["fr", "en", "notes"],
          properties: {
            fr: { type: "string" },
            en: { type: "string" },
            notes: {
              type: "object",
              additionalProperties: false,
              required: ["fr", "en"],
              properties: { fr: { type: "string" }, en: { type: "string" } },
            },
          },
        },
      },

      exercises: {
        type: "array",
        minItems: 6,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["type", "prompt", "answer"],
          properties: {
            type: { type: "string", enum: ["fill_blank", "translate", "short_answer"] },

            prompt: {
              type: "object",
              additionalProperties: false,
              required: ["fr", "en"],
              properties: { fr: { type: "string" }, en: { type: "string" } },
            },

            answer: {
              type: "object",
              additionalProperties: false,
              required: ["fr", "en"],
              properties: { fr: { type: "string" }, en: { type: "string" } },
            },
          },
        },
      },

      miniQuiz: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "choices", "correctIndex", "explanation"],
          properties: {
            question: {
              type: "object",
              additionalProperties: false,
              required: ["fr", "en"],
              properties: { fr: { type: "string" }, en: { type: "string" } },
            },
            choices: {
              type: "array",
              minItems: 4,
              maxItems: 4,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["fr", "en"],
                properties: { fr: { type: "string" }, en: { type: "string" } },
              },
            },
            correctIndex: { type: "integer", minimum: 0, maximum: 3 },
            explanation: {
              type: "object",
              additionalProperties: false,
              required: ["fr", "en"],
              properties: { fr: { type: "string" }, en: { type: "string" } },
            },
          },
        },
      },

      tips: {
        type: "object",
        additionalProperties: false,
        required: ["fr", "en"],
        properties: { fr: { type: "string" }, en: { type: "string" } },
      },

      renderMarkdown: {
        type: "object",
        additionalProperties: false,
        required: ["fr", "en"],
        properties: { fr: { type: "string" }, en: { type: "string" } },
      },
    },
  },
};
