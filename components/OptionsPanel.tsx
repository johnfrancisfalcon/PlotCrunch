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
        <form
            onSubmit={handleSubmit}
            className="bg-brand-gray rounded-2xl shadow-lg p-8 w-full max-w-xl space-y-6 border border-gray-700"
        >
            <h2 className="text-2xl font-bold text-white mb-2">⚙️ Summary Options</h2>
            <p className="text-gray-400 text-sm mb-6">Choose how you want your summary to look and feel.</p>

            {/* Length Selector */}
            <div className="flex justify-between items-center">
                <label className="text-gray-300">Length</label>
                <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="bg-brand-dark border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple"
                >
                    <option value="extreme">⚡ Extreme Short</option>
                    <option value="short">⏱️ Short</option>
                    <option value="normal">📏 Normal</option>
                    <option value="long">🎬 Long</option>
                </select>
            </div>

            {/* Style Selector */}
            <div className="flex justify-between items-center">
                <label className="text-gray-300">Style</label>
                <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="bg-brand-dark border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple"
                >
                    <option value="standard">📖 Standard</option>
                    <option value="fun">😂 Fun</option>
                </select>
            </div>

            {/* Subtitles */}
            <div className="flex items-center justify-between">
                <label className="text-gray-300">Add Subtitles</label>
                <input
                    type="checkbox"
                    checked={subtitles}
                    onChange={(e) => setSubtitles(e.target.checked)}
                    className="w-5 h-5 text-brand-purple focus:ring-brand-purple bg-brand-dark border-gray-700 rounded"
                />
            </div>

            {/* Plot Focus */}
            <div className="flex items-center justify-between">
                <label className="text-gray-300">Focus on Main Plot</label>
                <input
                    type="checkbox"
                    checked={plotFocus}
                    onChange={(e) => setPlotFocus(e.target.checked)}
                    className="w-5 h-5 text-brand-purple focus:ring-brand-purple bg-brand-dark border-gray-700 rounded"
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                className="w-full bg-brand-purple py-3 rounded-lg text-white font-bold hover:bg-purple-700 transition disabled:opacity-50"
                disabled={loading}
            >
                {loading ? "⏳ Starting…" : "⚡ Generate Summary"}
            </button>
        </form>
    );
}
