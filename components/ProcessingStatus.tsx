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
                (window as any).__jobState = j;
                // surface preview-only or transcript error banner
                (window as any).__jobState = j;

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
                    {(window as any).__jobState?.asrUsed && (
                        <p className="text-xs text-gray-400 mb-2">Engine: {((window as any).__jobState?.asrUsed === 'local') ? 'Local' : ((window as any).__jobState?.asrUsed === 'openai') ? 'OpenAI' : 'Groq'}</p>
                    )}
                    <div className="w-full bg-gray-800 h-4 rounded-lg overflow-hidden">
                        <div
                            className="bg-brand-purple h-4 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-gray-400 mt-3">{progress}% complete</p>
                    {(((window as any).__jobState?.previewOnly) || (window as any).__jobState?.transcriptError) && (
                        <div className="mt-3 text-sm text-yellow-300">
                            Transcription deferred: {(window as any).__jobState?.transcriptError || 'quota/connection issue'}
                            <button
                                onClick={async () => {
                                    try {
                                        await fetch(`/api/jobs/${jobId}/retry-transcription`, { method: 'POST' });
                                        alert('Retry started');
                                    } catch (e) {
                                        alert('Retry failed');
                                    }
                                }}
                                className="ml-3 inline-block bg-brand-purple hover:bg-purple-700 text-white font-semibold px-3 py-1 rounded"
                            >
                                Retry Transcription
                            </button>
                        </div>
                    )}
                    {((window as any).__jobState?.asrPreferred === 'external' && (window as any).__jobState?.asrUsed === 'local') && (
                        <p className="text-xs text-yellow-300 mt-2">External API unavailable; fell back to Local.</p>
                    )}
                    {step?.toLowerCase().includes('transcription complete') && (
                        <p className="text-green-400 mt-2">✅ Transcription complete</p>
                    )}
                </>
            )}
        </div>
    );
}
