import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom"; // ✅ add useSearchParams
import { useAuth } from "../Context/AuthContext";
import API from "../API/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "./Navbar";

const pickLang = (obj, lang) => {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return lang === "fr" ? obj.fr : obj.en;
};

export default function LessonCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { level, dayNumber } = useParams();
  const [searchParams] = useSearchParams();

  const userId = searchParams.get("userId") || user?._id;

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levelLessons, setLevelLessons] = useState([]);

  // language selector
  const languageOptions = useMemo(
    () => [
      { code: "fr", label: "French (FR)" },
      { code: "en", label: "English (EN)" },
    ],
    []
  );
  const [selectedLang, setSelectedLang] = useState("fr");

  // ElevenLabs TTS
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopTTS = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  };

  const playTTS = async (text) => {
    const clean = String(text || "").trim();
    if (!clean) return;

    try {
      stopTTS();
      const res = await API.post(
        "/api/voice/tts",
        { text: clean },
        { responseType: "blob" }
      );

      const url = URL.createObjectURL(res.data);
      const audio = new Audio(url);

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      audioRef.current = audio;
      setIsPlaying(true);
      await audio.play();
    } catch (err) {
      console.error("TTS failed:", err?.response?.data || err);
      setIsPlaying(false);
      alert("Text-to-speech failed.");
    }
  };

  // STT
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");

  const pickMimeType = () => {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
    return types.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || "";
  };

  const startListening = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Microphone not supported in this browser.");
        return;
      }

      setSpokenText("");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstart = () => setListening(true);

      recorder.onerror = (e) => {
        console.error("Recorder error:", e);
        setListening(false);
      };

      recorder.onstop = async () => {
        setListening(false);

        try {
          const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
          const form = new FormData();
          form.append("audio", blob, "speech.webm");

          const res = await API.post("/api/voice/stt", form);
          setSpokenText(res.data?.text || "");
        } catch (err) {
          console.error("STT failed:", err?.response?.data || err);
          alert("Speech-to-text failed.");
        } finally {
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      recorder.start();
    } catch (err) {
      console.error("Mic error:", err);
      setListening(false);
      alert("Could not access microphone. Check browser permissions.");
    }
  };

  const stopListening = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  };

  // Fetch list (prev/next)
  useEffect(() => {
    const fetchLevelLessons = async () => {
      if (!level) return;
      try {
        const res = await API.get(`/api/lessons/${level}`);
        const sorted = [...(res.data || [])].sort((a, b) => a.dayNumber - b.dayNumber);
        setLevelLessons(sorted);
      } catch (err) {
        console.error("Failed to fetch lessons list:", err);
      }
    };
    fetchLevelLessons();
  }, [level]);

  // Fetch current lesson (include userId so middleware can check)
  useEffect(() => {
    const fetchLesson = async () => {
      if (!level || !dayNumber) return;

      setLoading(true);
      try {
        const res = await API.get(
          `/api/lessons/${level}/${dayNumber}?userId=${userId}`
        );
        setLesson(res.data);
      } catch (err) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err.message;
        console.error("Failed to fetch lesson:", msg);

        if (status === 403) {
          alert("🔒 Access denied. Please upgrade your plan.");
          navigate("/pricing");
          return;
        }

        setLesson(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [level, dayNumber, userId, navigate]);

  const markComplete = async () => {
    try {
      await API.post("/api/lessons/progress", {
        userId: user?._id,
        level,
        dayNumber: Number(dayNumber),
        score: 100,
        accuracy: 100,
        timeSpent: 300,
      });
      alert("Lesson marked as complete ");
    } catch (err) {
      console.error("Failed to mark complete:", err?.response?.data || err);
      alert("Failed to mark complete");
    }
  };

  const title = lesson?.title || "";
  const aiContent = lesson?.aiContent;

  const markdownText =
    selectedLang === "fr"
      ? aiContent?.renderMarkdown?.fr
      : aiContent?.renderMarkdown?.en;

  const fallbackExplanation =
    selectedLang === "fr"
      ? aiContent?.explanation?.short?.fr || aiContent?.explanation?.detailed?.fr
      : aiContent?.explanation?.short?.en || aiContent?.explanation?.detailed?.en;

  const safeMarkdown = useMemo(() => {
    const md = String(markdownText || "");
    const lines = md.split("\n");
    const out = [];
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isTableRow = /^\s*\|.*\|\s*$/.test(line);
      const isSeparator = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line);

      if (isTableRow || isSeparator) {
        inTable = true;
        out.push(line);
        continue;
      }

      if (inTable) {
        if (line.trim() === "") continue;
        inTable = false;
      }

      out.push(line);
    }

    return out.join("\n").replace(/\n{3,}/g, "\n\n");
  }, [markdownText]);

  const ttsText = safeMarkdown || fallbackExplanation || "";

  // prev/next
  const currentIndex = levelLessons.findIndex(
    (l) => Number(l.dayNumber) === Number(dayNumber)
  );
  const prevLesson = currentIndex > 0 ? levelLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < levelLessons.length - 1
      ? levelLessons[currentIndex + 1]
      : null;

  if (loading) return <div className="p-6">Loading lesson...</div>;
  if (!lesson) return <div className="p-6">Lesson not found</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-xl space-y-5">
      <Navbar/>
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex gap-3">
            <button
              disabled={!prevLesson}
              onClick={() =>
                navigate(`/lessons/${level}/${prevLesson.dayNumber}?userId=${userId}`)
              }
              className="px-4 py-2 rounded bg-gray-100 text-gray-800 disabled:opacity-50"
            >
              ← Previous
            </button>

            <button
              disabled={!nextLesson}
              onClick={() =>
                navigate(`/lessons/${level}/${nextLesson.dayNumber}?userId=${userId}`)
              }
              className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
            >
              Next →
            </button>
          </div>

          <h2 className="text-2xl font-bold">
            {String(level).toUpperCase()} – Day {dayNumber}
          </h2>
          <h3 className="text-lg font-semibold">{title}</h3>

          {aiContent?.objective ? (
            <p className="text-sm text-gray-600 mt-1">
              {pickLang(aiContent.objective, selectedLang)}
            </p>
          ) : null}
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">View lesson in:</span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {languageOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={() => playTTS(ttsText)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          🔊 Listen
        </button>

        <button
          onClick={stopTTS}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
          disabled={!isPlaying}
        >
          ⏹ Stop
        </button>

        {!listening ? (
          <button
            onClick={startListening}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            🎤 Speak
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="px-4 py-2 bg-green-800 text-white rounded"
          >
            ⏹ Stop Speaking
          </button>
        )}

        <button
          onClick={markComplete}
          className="px-4 py-2 bg-purple-600 text-white rounded"
        >
          Mark Complete
        </button>
      </div>

      {spokenText && (
        <div className="p-3 bg-gray-100 rounded">
          <strong>You said:</strong> {spokenText}
        </div>
      )}

      {/* Markdown */}
      <div className="border rounded-xl p-5 bg-white">
        {markdownText ? (
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {safeMarkdown}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-gray-800 whitespace-pre-line">
            {fallbackExplanation || "No content available."}
          </div>
        )}
      </div>

      {/* Structured sections */}
      <div className="mt-6 space-y-6">
        {(aiContent?.grammarFocus?.length || aiContent?.vocabTheme?.length) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aiContent?.grammarFocus?.length ? (
              <section className="p-4 border rounded-xl">
                <h4 className="text-lg font-bold mb-2">📘 Grammar Focus</h4>
                <ul className="list-disc ml-5 space-y-1">
                  {aiContent.grammarFocus.map((g, i) => (
                    <li key={i}>{pickLang(g, selectedLang)}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {aiContent?.vocabTheme?.length ? (
              <section className="p-4 border rounded-xl">
                <h4 className="text-lg font-bold mb-2">Vocab Theme</h4>
                <ul className="list-disc ml-5 space-y-1">
                  {aiContent.vocabTheme.map((v, i) => (
                    <li key={i}>{pickLang(v, selectedLang)}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}

        {aiContent?.explanation ? (
          <section className="p-4 border rounded-xl">
            <h4 className="text-lg font-bold mb-2"> Explanation</h4>
            <p className="whitespace-pre-line text-gray-800">
              {selectedLang === "fr"
                ? aiContent.explanation?.detailed?.fr || aiContent.explanation?.short?.fr
                : aiContent.explanation?.detailed?.en || aiContent.explanation?.short?.en}
            </p>
          </section>
        ) : null}

        {!!aiContent?.keyPoints?.length && (
          <section className="p-4 border rounded-xl">
            <h4 className="text-lg font-bold mb-2"> Key Points</h4>
            <ul className="list-disc ml-5 space-y-2">
              {aiContent.keyPoints.map((kp, idx) => (
                <li key={idx}>
                  <div className="font-semibold">
                    {pickLang(kp.point, selectedLang)}
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">FR:</span> {kp.exampleFr}
                    <br />
                    <span className="font-medium">EN:</span> {kp.exampleEn}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!!aiContent?.examples?.length && (
          <section className="p-4 border rounded-xl">
            <h4 className="text-lg font-bold mb-2"> Examples</h4>
            <div className="space-y-3">
              {aiContent.examples.map((ex, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold">FR: {ex.fr}</div>
                  <div className="text-gray-800">EN: {ex.en}</div>
                  {ex.notes ? (
                    <div className="text-sm text-gray-600 mt-1">
                      {pickLang(ex.notes, selectedLang)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        )}

        {aiContent?.tips ? (
          <section className="p-4 border rounded-xl">
            <h4 className="text-lg font-bold mb-2"> Tips</h4>
            <p className="text-gray-800">{pickLang(aiContent.tips, selectedLang)}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
