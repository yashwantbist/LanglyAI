const lessonJsonSchema = {
  name: "lesson_ai_content",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "objective","grammarFocus","vocabTheme",
      "explanation","keyPoints","examples",
      "exercises","miniQuiz","tips"
    ],
    properties: {
      objective: { type: "string" },
      grammarFocus: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
      vocabTheme: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 10 },

      explanation: {
        type: "object",
        additionalProperties: false,
        required: ["short","detailed"],
        properties: {
          short: { type: "string" },
          detailed: { type: "string" }
        }
      },

      keyPoints: {
        type: "array",
        minItems: 4,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["point","exampleFr","exampleEn"],
          properties: {
            point: { type: "string" },
            exampleFr: { type: "string" },
            exampleEn: { type: "string" }
          }
        }
      },

      examples: {
        type: "array",
        minItems: 6,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["fr","en","notes"],
          properties: {
            fr: { type: "string" },
            en: { type: "string" },
            notes: { type: "string" }
          }
        }
      },

      exercises: {
        type: "array",
        minItems: 6,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["type","prompt","answer"],
          properties: {
            type: { type: "string", enum: ["fill_blank","translate","short_answer"] },
            prompt: { type: "string" },
            answer: { type: "string" }
          }
        }
      },

      miniQuiz: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question","choices","correctIndex","explanation"],
          properties: {
            question: { type: "string" },
            choices: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 4 },
            correctIndex: { type: "integer", minimum: 0, maximum: 3 },
            explanation: { type: "string" }
          }
        }
      },

      tips: { type: "string" }
    }
  }
};
