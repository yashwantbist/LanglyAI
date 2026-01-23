import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import API from "../API/api";


export default function LessonDetail() {
  const { user } = useAuth();
  const { level, dayNumber } = useParams();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spokenText, setSpokenText] = useState("");

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        // IMPORTANT: this endpoint should auto-generate if aiContent missing (backend change below)
        const res = await API.get(`/api/lessons/${level}/${dayNumber}`);
        setLesson(res.data);
      } catch (err) {
        console.error("Failed to fetch lesson:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [level, dayNumber]);

  const speak = (text) => {
    if (!window.speechSynthesis) return alert("TTS not supported");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported");

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;

    recognition.onresult = (event) => setSpokenText(event.results[0][0].transcript);
    recognition.start();
  };

  const markComplete = async () => {
    try {
      await API.post("/api/lessons/progress", {
        userId: user._id,
        level,
        dayNumber: Number(dayNumber),
        score: 100,
        accuracy: 100,
        timeSpent: 300,
      });
      alert("Lesson marked as complete ✅");
    } catch (err) {
      console.error("Failed to mark complete:", err);
    }
  };

  if (loading) return <div className="p-6">Loading lesson...</div>;
  if (!lesson) return <div className="p-6">Lesson not found</div>;

  const { title, aiContent } = lesson;

 // ...inside LessonDetail component after: const { title, aiContent } = lesson;

return (
  <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-xl space-y-6">
    <div>
      <h2 className="text-2xl font-bold">
        {level} – Day {dayNumber}
      </h2>
      <h3 className="text-lg font-semibold">{title}</h3>
      {aiContent?.objective ? (
        <p className="text-sm text-gray-600 mt-1">🎯 {aiContent.objective}</p>
      ) : null}
    </div>

    {/* Grammar + Vocab */}
    {(aiContent?.grammarFocus?.length || aiContent?.vocabTheme?.length) && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {aiContent?.grammarFocus?.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Grammar Focus</h4>
            <ul className="list-disc ml-5 space-y-1">
              {aiContent.grammarFocus.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        )}

        {aiContent?.vocabTheme?.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Vocab Theme</h4>
            <ul className="list-disc ml-5 space-y-1">
              {aiContent.vocabTheme.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}

    {/* Explanation */}
    {(aiContent?.explanation?.short || aiContent?.explanation?.detailed) && (
      <div className="space-y-3">
        {aiContent?.explanation?.short && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Quick Explanation</h4>
            <p className="whitespace-pre-line text-gray-800">
              {aiContent.explanation.short}
            </p>
          </div>
        )}

        {aiContent?.explanation?.detailed && (
          <div className="p-4 bg-white border rounded-lg">
            <h4 className="font-semibold mb-2">Detailed Explanation</h4>
            <p className="whitespace-pre-line text-gray-800">
              {aiContent.explanation.detailed}
            </p>
          </div>
        )}
      </div>
    )}

    {/* Key Points */}
    {aiContent?.keyPoints?.length > 0 && (
      <div>
        <h4 className="font-semibold mb-2">Key Points</h4>
        <div className="space-y-3">
          {aiContent.keyPoints.map((kp, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium">{i + 1}. {kp.point}</div>
              {(kp.exampleFr || kp.exampleEn) && (
                <div className="mt-2 text-sm">
                  {kp.exampleFr ? <div>🇫🇷 {kp.exampleFr}</div> : null}
                  {kp.exampleEn ? <div className="text-gray-700">🇬🇧 {kp.exampleEn}</div> : null}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Examples */}
    {aiContent?.examples?.length > 0 && (
      <div>
        <h4 className="font-semibold mb-2">Examples</h4>
        <ul className="space-y-3">
          {aiContent.examples.map((ex, i) => (
            <li key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium">🇫🇷 {ex.fr}</div>
              <div className="text-gray-700">🇬🇧 {ex.en}</div>
              {ex.notes ? (
                <div className="text-sm text-gray-500 mt-1">📝 {ex.notes}</div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Exercises */}
    {aiContent?.exercises?.length > 0 && (
      <div>
        <h4 className="font-semibold mb-2">Exercises</h4>
        <ol className="list-decimal ml-6 space-y-2">
          {aiContent.exercises.map((ex, i) => (
            <li key={i} className="p-3 bg-white border rounded-lg">
              <div className="text-xs uppercase text-gray-500 mb-1">
                {ex.type?.replace("_", " ")}
              </div>
              <div className="font-medium">{ex.prompt}</div>
              {ex.answer ? (
                <div className="text-sm text-green-700 mt-2">
                  ✅ Answer: {ex.answer}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    )}

    {/* Mini Quiz */}
    {aiContent?.miniQuiz?.length > 0 && (
      <div>
        <h4 className="font-semibold mb-2">Mini Quiz</h4>
        <div className="space-y-4">
          {aiContent.miniQuiz.map((q, i) => (
            <div key={i} className="p-4 bg-white border rounded-lg">
              <div className="font-medium">{i + 1}. {q.question}</div>
              <ul className="mt-2 space-y-1">
                {q.choices?.map((c, idx) => (
                  <li
                    key={idx}
                    className={`px-3 py-1 rounded ${
                      idx === q.correctIndex ? "bg-green-50" : "bg-gray-50"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}. {c}
                    {idx === q.correctIndex ? " ✅" : ""}
                  </li>
                ))}
              </ul>
              {q.explanation ? (
                <div className="text-sm text-gray-600 mt-2">💡 {q.explanation}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Tip */}
    {aiContent?.tips ? (
      <div className="italic text-sm text-gray-600">💡 Tip: {aiContent.tips}</div>
    ) : null}

    {/* Controls */}
    <div className="flex flex-wrap gap-3 pt-2">
      <button
        onClick={() =>
          speak(
            aiContent?.explanation?.short ||
              aiContent?.explanation?.detailed ||
              ""
          )
        }
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        🔊 Listen
      </button>

      <button
        onClick={startListening}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        🎤 Speak
      </button>

      <button
        onClick={markComplete}
        className="px-4 py-2 bg-purple-600 text-white rounded"
      >
        ✅ Mark Complete
      </button>
    </div>

    {spokenText && (
      <div className="mt-2 p-3 bg-gray-100 rounded">
        <strong>You said:</strong> {spokenText}
      </div>
    )}
  </div>
);

}
