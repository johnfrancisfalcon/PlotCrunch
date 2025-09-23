// components/OptionsPanel.tsx
import { useState } from "react";

type Props = {
    file: File;
    onStart: (jobId: string) => void;
};

export default function OptionsPanel({ file, onStart }: Props) {
    const [length, setLength] = useState("normal");
    const [style, setStyle] = useState("standard");
    const [subtitles, setSubtitles] = useState(false);
    const [plotFocus, setPlotFocus] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert("Please upload a video first!");

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("length", length);
            fd.append("style", style);
            fd.append("subtitles", String(subtitles));
            fd.append("plotFocus", String(plotFocus));

            const resp = await fetch("/api/summarize", { method: "POST", body: fd });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data?.error || "Failed to start job");

            onStart(data.jobId);
        } catch (err: any) {
            alert(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-brand-dark rounded-lg p-6 mt-4 space-y-4">
            <h2 className="text-xl font-bold">Choose Summary Options</h2>

            <label className="block">
                <span>Length:</span>
                <select value={length} onChange={(e) => setLength(e.target.value)} className="ml-2">
                    <option value="extreme">Extreme Short</option>
                    <option value="short">Short</option>
                    <option value="normal">Normal</option>
                    <option value="long">Long</option>
                </select>
            </label>

            <label className="block">
                <span>Style:</span>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className="ml-2">
                    <option value="standard">Standard</option>
                    <option value="fun">Fun</option>
                </select>
            </label>

            <label className="block">
                <input type="checkbox" checked={subtitles} onChange={(e) => setSubtitles(e.target.checked)} />
                <span className="ml-2">Add subtitles overlay</span>
            </label>

            <label className="block">
                <input type="checkbox" checked={plotFocus} onChange={(e) => setPlotFocus(e.target.checked)} />
                <span className="ml-2">Focus on main plot only</span>
            </label>

            <button
                className="w-full bg-brand-purple py-2 rounded text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                disabled={loading}
            >
                {loading ? "Starting…" : "⚡ Generate Summary"}
            </button>
        </form>
    );
}
