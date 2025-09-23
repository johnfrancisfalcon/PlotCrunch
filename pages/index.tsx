// pages/index.tsx
import { useState } from "react";
import UploadBox from "../components/UploadBox";
import OptionsPanel from "../components/OptionsPanel";
import ProcessingStatus from "../components/ProcessingStatus";
import ResultPlayer from "../components/ResultPlayer";

export default function Home() {
    const [file, setFile] = useState<File | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const reset = () => {
        setFile(null);
        setJobId(null);
        setResultUrl(null);
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center text-center p-6">
            {/* Hero Section */}
            <div className="max-w-2xl mb-12">
                <h1 className="text-5xl md:text-6xl font-extrabold text-brand-purple mb-4 drop-shadow-lg">
                    PlotCrunch
                </h1>
                <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
                    Upload movies or episodes and get AI-powered summaries in minutes.
                    Choose your style, length, and let the magic happen.
                </p>
            </div>

            {/* Flow */}
            {!file && !jobId && !resultUrl && <UploadBox onFileUploaded={setFile} />}

            {file && !jobId && !resultUrl && (
                <OptionsPanel file={file} onStart={(id) => setJobId(id)} />
            )}

            {jobId && !resultUrl && (
                <ProcessingStatus jobId={jobId} onDone={(url) => setResultUrl(url)} />
            )}

            {resultUrl && (
                <ResultPlayer url={resultUrl} meta="(demo output)" onReset={reset} />
            )}
        </main>
    );
}
