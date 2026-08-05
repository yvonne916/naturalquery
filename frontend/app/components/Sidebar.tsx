"use client";

import UploadArea from "./UploadArea";
import DatasetSelector from "./DatasetSelector";

interface SidebarProps {
  files: File[];
  datasets: string[];
  selectedDataset: string;
  onFileChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onSelectDataset: (dataset: string) => void;
}

export default function Sidebar({
  files,
  datasets,
  selectedDataset,
  onFileChange,
  onRemoveFile,
  onSelectDataset,
}: SidebarProps) {
  return (
    <div className="w-64 shrink-0">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Data Source</p>
        
        <UploadArea
          files={files}
          datasets={datasets}
          onFileChange={onFileChange}
          onRemoveFile={onRemoveFile}
        />

        <DatasetSelector
          datasets={datasets}
          selectedDataset={selectedDataset}
          onSelect={onSelectDataset}
        />
      </div>
    </div>
  );
}