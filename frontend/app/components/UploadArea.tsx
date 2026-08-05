"use client";

interface UploadAreaProps {
  files: File[];
  datasets: string[];
  onFileChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
}

export default function UploadArea({
  files,
  datasets,
  onFileChange,
  onRemoveFile,
}: UploadAreaProps) {
  return (
    <div>
      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
        <svg className="w-6 h-6 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <span className="text-xs text-gray-400">Upload CSV files</span>
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          multiple
          onChange={(e) => {
            const newFiles = Array.from(e.target.files || []);
            onFileChange([...files, ...newFiles]);
          }}
        />
      </label>

      {files && files.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-medium text-blue-700 mb-2">Uploaded files ({files.length}):</p>
          <div className="space-y-1">
            {files.map((file: File, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-xs text-blue-600">✓ {file.name}</p>
                <button
                  onClick={() => onRemoveFile(i)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}