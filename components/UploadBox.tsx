import { useState } from "react";

type Props = { onFileUploaded: (file: File) => void };

export default function UploadBox({ onFileUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      onFileUploaded(f);
    }
  };

  return (
    <div className="bg-brand-dark border-2 border-dashed border-brand-purple rounded-lg p-6 text-center cursor-pointer hover:bg-gray-800 transition">
      <input type="file" accept="video/*" className="hidden" id="upload" onChange={handleFileChange} />
      <label htmlFor="upload" className="block cursor-pointer">
        {!file ? (
          <div>
            <p className="text-gray-300">📂 Upload Your Video</p>
            <p className="text-sm text-gray-500">or drag & drop (MP4, MOV, AVI)</p>
          </div>
        ) : (
          <div>
            <p className="font-semibold">{file.name}</p>
            <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}
      </label>
    </div>
  );
}
