// Components/LessonPreviewCard.jsx
export default function LessonPreviewCard({
  lesson,
  completed,
  locked,
  onAction,
}) {
  const label = locked
    ? "👀 Preview"
    : completed
    ? "▶ Review"
    : "▶ Start";

  return (
    <div className="relative border rounded-lg p-4 shadow hover:shadow-md">
      <h3 className="font-bold">{lesson.title}</h3>
      <p className="text-sm text-gray-600">Day {lesson.dayNumber}</p>

      {completed && (
        <span className="block mt-1 text-green-600 text-sm font-semibold">
          ✅ Completed
        </span>
      )}

      <button
        type="button"
        onClick={onAction}
        className={`mt-4 w-full px-4 py-2 rounded text-sm font-semibold transition
          ${
            locked
              ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
      >
        {label}
      </button>

      {locked && (
        <div className="absolute inset-0 bg-white/60 pointer-events-none rounded-lg" />
      )}
    </div>
  );
}
