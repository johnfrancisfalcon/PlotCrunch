// components/ResultPlayer.tsx
type Props = {
    url: string;
    meta?: string;
    onReset: () => void;
};

export default function ResultPlayer({ url, meta, onReset }: Props) {
    return (
        <div className="bg-brand-gray rounded-2xl shadow-xl p-8 w-full max-w-2xl text-center border border-gray-700 mt-10">
            <h2 className="text-2xl font-bold text-white mb-6">🎉 Your Summary is Ready</h2>

            {/* Video Player */}
            <div className="rounded-xl overflow-hidden shadow-lg mb-4">
                <video
                    controls
                    className="w-full h-auto rounded-xl"
                    src={url}
                />
            </div>

            {/* Meta Info */}
            {meta && <p className="text-gray-400 text-sm mb-6">{meta}</p>}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                    href={url}
                    download
                    className="flex-1 bg-brand-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                    ⬇️ Download
                </a>
                <button
                    onClick={onReset}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                    🔄 Try Again
                </button>
                <button
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-lg transition"
                >
                    📤 Share
                </button>
            </div>
        </div>
    );
}
