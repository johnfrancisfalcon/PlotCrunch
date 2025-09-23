type Props = { step: number; error?: string };

export default function ProcessingStatus({ step, error }: Props) {
  const steps = [
    "Video Upload",
    "AI Transcription",
    "Content Analysis",
    "Scene Selection",
    "AI Voiceover",
    "Video Compilation"
  ];

  return (
    <div className="bg-brand-dark rounded-lg p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">Processing Status</h2>
      <ul className="space-y-2">
        {steps.map((label, i) => {
          const idx = i + 1;
          const isDone = idx < step;
          const isActive = idx === step;
          const failed = error && idx === step;

          return (
            <li key={idx} className="flex items-center space-x-2">
              {failed ? (
                <span className="text-red-500">❌</span>
              ) : isDone ? (
                <span className="text-green-500">✅</span>
              ) : isActive ? (
                <span className="text-brand-purple">◉</span>
              ) : (
                <span className="text-gray-500">●</span>
              )}
              <span className={failed ? "text-red-400" : ""}>{label}</span>
              {failed && <span className="ml-2 text-sm text-red-400">{error}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
