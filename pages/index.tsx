import { useState } from "react";
import UploadBox from "../components/UploadBox";
import OptionsPanel from "../components/OptionsPanel";
import ProcessingStatus from "../components/ProcessingStatus";
import ResultPlayer from "../components/ResultPlayer";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleStart = () => {
    setStarted(true);
    setStep(1);
    setError(null);

    let i = 1;
    const interval = setInterval(() => {
      if (i === 4) {
        setError("Scene detection failed");
        clearInterval(interval);
        return;
      }
      i++;
      setStep(i);
      if (i > 6) {
        clearInterval(interval);
        setResultUrl("/demo.mp4");
      }
    }, 1500);
  };

  const handleReset = () => {
    setFile(null);
    setStarted(false);
    setStep(1);
    setError(null);
    setResultUrl(null);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-8">
      <h1 className="text-4xl font-bold text-brand-purple mb-6">PlotCrunch</h1>
      <p className="text-gray-400 mb-8">Transform long videos into engaging summaries with AI-powered analysis and voiceover</p>

      {!file && <UploadBox onFileUploaded={setFile} />}

      {file && !started && !resultUrl && <OptionsPanel onStart={handleStart} />}

      {started && !resultUrl && <ProcessingStatus step={step} error={error || undefined} />}

      {resultUrl && <ResultPlayer url={resultUrl} meta="25% of original length • Standard Style" onReset={handleReset} />}
    </main>
  );
}
