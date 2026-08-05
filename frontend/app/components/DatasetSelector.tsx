"use client";

interface DatasetSelectorProps {
  datasets: string[];
  selectedDataset: string;
  onSelect: (dataset: string) => void;
}

export default function DatasetSelector({
  datasets,
  selectedDataset,
  onSelect,
}: DatasetSelectorProps) {
  if (datasets.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-700 mb-2">Preview</p>
      <div className="space-y-2">
        {datasets.map((dataset) => (
          <label key={dataset} className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="radio"
              name="dataset"
              value={dataset}
              checked={selectedDataset === dataset}
              onChange={() => onSelect(dataset)}
            />
            {dataset}
          </label>
        ))}
      </div>
    </div>
  );
}