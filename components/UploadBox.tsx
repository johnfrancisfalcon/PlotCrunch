// components/UploadBox.tsx
type Props = { onFileUploaded: (file: File) => void };

export default function UploadBox({ onFileUploaded }: Props) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            onFileUploaded(e.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-lg p-10 bg-brand-gray rounded-2xl shadow-lg text-center border border-gray-700 hover:border-brand-purple transition">
            <h2 className="text-2xl font-semibold mb-4">📂 Upload your video</h2>
            <p className="text-gray-400 mb-6">Drag & drop a file or click to select</p>
            <label className="cursor-pointer bg-brand-purple hover:bg-purple-700 px-6 py-3 rounded-lg text-white font-bold transition inline-block">
                Choose File
                <input type="file" accept="video/*" className="hidden" onChange={handleChange} />
            </label>
        </div>
    );
}
