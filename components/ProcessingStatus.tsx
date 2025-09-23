// components/ProcessingStatus.tsx
import { useEffect, useState } from "react";

type Props = {
    jobId: string;
    onDone: (resultUrl: string) => void;
};

export default function ProcessingStatus({ jobId, onDone }: Props) {
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
                    setError(j.log || "Processing error");
                    clearInterval(int);
                } else if (j.status === "done") {
                    clearInterval(int);
                    onDone(j.resultUrl);
                }
            } catch (e: any) {
                if (!active) return;
                setError(e.message || "Network error");
                clearInterval(int);
            }
        }, 1000);
        return () => {
            active = false;
            clearInterval(int);
        };
    }, [jobId, onDone]);

    return (
        <div className="bg-brand-dark rounded-lg p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Processing Status</h2>
            {error ? (
                <p className="text-red-400">❌ {error}</p>
            ) : (
                <>
                    <p className="text-gray-300">{step}</p>
                    <div className="w-full bg-gray-800 h-3 rounded mt-3">
                        <div className="bg-brand-purple h-3 rounded" style={{ width: `${progress}%` }} />
                    </div>
                </>
            )}
        </div>
    );
}
