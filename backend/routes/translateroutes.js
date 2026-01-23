import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { text, target = "en", source } = req.body;
    if (!text) return res.status(400).json({ message: "text required" });

    const params = new URLSearchParams();
    params.set("key", process.env.GOOGLE_TRANSLATE_API_KEY);
    params.append("q", text);
    params.set("target", target);
    if (source) params.set("source", source);

    const r = await fetch(`https://translate.googleapis.com/language/translate/v2?${params.toString()}`, {
      method: "POST",
    });

    if (!r.ok) {
  const errText = await r.text();
  console.error("Google Translate error:", r.status, errText);
  return res.status(500).json({ message: "Translate failed", details: errText });
}

    const data = await r.json();
    const translated = data?.data?.translations?.[0]?.translatedText ?? "";
    res.json({ translation: translated });
  } catch (e) {
    res.status(500).json({ message: "Translate error", error: e.message });
  }
});

export default router;
