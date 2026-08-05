"use client";

interface PreviewTableProps {
  tableName: string;
  columns: string[];
  rows: any[];
  rowCount: number;
}

export default function PreviewTable({
  tableName,
  columns,
  rows,
  rowCount,
}: PreviewTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-mono text-gray-400 mb-3">
        {tableName} - {rowCount} rows
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map((col: string) => (
                <th key={col} className="text-left text-xs text-gray-400 font-semibold pb-2 pr-6 uppercase tracking-wide">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, j: number) => (
              <tr key={j} className="border-b border-gray-50">
                {columns.map((col: string) => (
                  <td key={col} className="py-2 pr-6 text-gray-700 text-sm">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}