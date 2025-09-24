// components/ProcessingStatus.tsx
import { useEffect, useState } from "react";

type Props = {
    jobId: string;
    onDone: (resultUrl: string) => void;
    onError?: (message: string) => void;
};

export default function ProcessingStatus({ jobId, onDone, onError }: Props) {
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState("Queued");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const int = setInterval(async () => {
            try {
                const r = await fetch(`/api/jobs/${jobId}`);
                const j = await r.json();
                if (!r.ok) throw new Error(j?.error || "Job failed");
                if (!active) return;

                setProgress(j.progress ?? 0);
                setStep(j.step ?? "…");

                if (j.status === "error") {
                    const message = j.log || "Processing error";
                    setError(message);
                    onError?.(message);
                    clearInterval(int);
                } else if (j.status === "done") {
                    clearInterval(int);
                    onDone(j.resultUrl);
                }
            } catch (e: any) {
                if (!active) return;
                const message = e.message || "Network error";
                setError(message);
                onError?.(message);
                clearInterval(int);
            }
        }, 1000);
        return () => {
            active = false;
            clearInterval(int);
        };
    }, [jobId, onDone]);

    return (
        <div className="bg-brand-gray rounded-2xl shadow-lg p-8 w-full max-w-xl mt-8 border border-gray-700 text-center">
            <h2 className="text-2xl font-bold text-white mb-6">🚀 Processing Your Video</h2>

            {error ? (
                <p className="text-red-400 font-semibold">❌ {error}</p>
            ) : (
                <>
                    <p className="text-gray-300 mb-4">Step: {step}</p>
                    {step?.toLowerCase().includes('transcribing') && (
                        <p className="text-gray-400 mb-2">⏳ Transcribing audio…</p>
                    )}
                    <div className="w-full bg-gray-800 h-4 rounded-lg overflow-hidden">
                        <div
                            className="bg-brand-purple h-4 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-gray-400 mt-3">{progress}% complete</p>
                    {step?.toLowerCase().includes('transcription complete') && (
                        <p className="text-green-400 mt-2">✅ Transcription complete</p>
                    )}
                </>
            )}
        </div>
    );
}
