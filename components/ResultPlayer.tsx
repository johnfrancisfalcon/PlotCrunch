type Props = { url: string; meta: string; onReset: () => void };

export default function ResultPlayer({ url, meta, onReset }: Props) {
  return (
    <div className="bg-brand-dark rounded-lg p-6 mt-6 text-center">
      <h2 className="text-xl font-bold mb-2">🎉 Your Summary is Ready!</h2>
      <p className="text-sm text-gray-400 mb-4">{meta}</p>
      <video src={url} controls className="w-full rounded mb-4" />
      <div className="flex justify-center space-x-4">
        <a href={url} download className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700">
          ⬇ Download Video
        </a>
        <button onClick={onReset} className="bg-gray-700 px-4 py-2 rounded text-white hover:bg-gray-600">
          🔄 Create Another
        </button>
      </div>
    </div>
  );
}
