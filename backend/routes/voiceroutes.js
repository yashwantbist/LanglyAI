import express from "express";
import multer from "multer";
import fetch from "node-fetch";

import FormData from "form-data";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post("/tts", async (req, res) => {
  try {
    const { text, voiceId: bodyVoiceId, outputFormat = "mp3_44100_128" } = req.body;

    const finalVoiceId = bodyVoiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID || "XW70ikSsadUbinwLMZ5w";

    if (!text) return res.status(400).json({ message: "text required" });
    if (!finalVoiceId) return res.status(400).json({ message: "voiceId required" });

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        output_format: outputFormat,
      }),
    });

    const audioBuffer = Buffer.from(await r.arrayBuffer());

    if (!r.ok) {
      console.error("ElevenLabs TTS error:", r.status, audioBuffer.toString("utf8"));
      return res.status(500).json({
        message: "ElevenLabs TTS failed",
        details: audioBuffer.toString("utf8"),
      });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (e) {
    console.error("TTS error:", e);
    res.status(500).json({ message: "TTS error", error: e.message });
  }
});


router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "audio file required (field name: audio)" });
    }

    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname || "speech.webm",
      contentType: req.file.mimetype || "audio/webm",
    });

    // Use current model id (docs show scribe_v2)
    form.append("model_id", "scribe_v2");

    const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        ...form.getHeaders(),
      },
      body: form,
    });

    const txt = await r.text();

    // IMPORTANT: return ElevenLabs status + details (don’t always force 500)
    if (!r.ok) {
      console.error("ElevenLabs STT error:", r.status, txt);
      return res.status(r.status).json({ message: "ElevenLabs STT failed", details: txt });
    }

    let data;
    try { data = JSON.parse(txt); } catch { data = { text: txt }; }

    res.json({ text: data.text ?? data.transcript ?? "" });
  } catch (e) {
    console.error("STT error:", e);
    res.status(500).json({ message: "STT error", error: e.message });
  }
});

export default router;