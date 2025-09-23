import { useState } from "react";

type Props = { onStart: (opts: any) => void };

export default function OptionsPanel({ onStart }: Props) {
  const [length, setLength] = useState("normal");
  const [style, setStyle] = useState("standard");
  const [subtitles, setSubtitles] = useState(false);
  const [plotFocus, setPlotFocus] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({ length, style, subtitles, plotFocus });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-brand-dark rounded-lg p-6 mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Summary Length</h3>
          <div className="space-y-2">
            {[
              { val: "extreme", label: "Extreme Short", desc: "~5% of original" },
              { val: "short", label: "Short", desc: "~15% of original" },
              { val: "normal", label: "Normal", desc: "~25% of original" },
              { val: "long", label: "Long", desc: "~50% of original" },
            ].map(opt => (
              <label key={opt.val} className="flex items-center space-x-2">
                <input type="radio" checked={length === opt.val} onChange={() => setLength(opt.val)} />
                <span>{opt.label} <span className="text-xs text-gray-400">{opt.desc}</span></span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Summary Style</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="radio" checked={style === "standard"} onChange={() => setStyle("standard")} />
              <span>Standard Recap <span className="text-xs text-gray-400">Professional, informative</span></span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" checked={style === "fun"} onChange={() => setStyle("fun")} />
              <span>Comedic Recap <span className="text-xs text-gray-400">Lighthearted, witty</span></span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={subtitles} onChange={() => setSubtitles(!subtitles)} />
          <span>Show subtitles on video</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={plotFocus} onChange={() => setPlotFocus(!plotFocus)} />
          <span>Focus only on main plot</span>
        </label>
      </div>

      <button className="w-full bg-brand-purple py-2 rounded text-white font-semibold hover:bg-purple-700 transition">
        ⚡ Generate Summary
      </button>
    </form>
  );
}
