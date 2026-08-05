"use client";

interface QueryInputProps {
  value: string;
  loading: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export default function QueryInput({
  value,
  loading,
  disabled,
  onChange,
  onSubmit,
  onKeyDown,
}: QueryInputProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex gap-3 items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask anything about your data..."
        className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-300"
      />
      <button
        onClick={onSubmit}
        disabled={loading || disabled}
        className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40 shadow-sm shrink-0"
      >
        {loading ? "..." : "Ask"}
      </button>
    </div>
  );
}