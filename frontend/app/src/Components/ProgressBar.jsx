export default function ProgressBar({ completed, total }) {
  const percent = total ? (completed / total) * 100 : 0;

  return (
    <div>
      <div className="w-full bg-gray-200 h-3 rounded">
        <div
          className="bg-green-500 h-3 rounded"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm mt-1 text-gray-600">
        {completed}/{total} lessons completed
      </p>
    </div>
  );
}
