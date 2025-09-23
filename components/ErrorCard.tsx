// components/ErrorCard.tsx
type Props = {
  message: string;
  onRetry: () => void;
};

export default function ErrorCard({ message, onRetry }: Props) {
  return (
    <div className="bg-red-900/60 rounded-2xl shadow-xl p-8 w-full max-w-xl text-center border border-red-600 mt-10">
      <h2 className="text-2xl font-bold text-red-400 mb-4">❌ Processing Failed</h2>
      <p className="text-gray-200 mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="bg-brand-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition"
      >
        🔄 Try Again
      </button>
    </div>
  );
}


