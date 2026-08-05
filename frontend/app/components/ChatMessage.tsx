"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ChatMessageProps {
  item: {
    question: string;
    sql: string;
    rows: any[];
    columns: string[];
  };
}

export default function ChatMessage({ item }: ChatMessageProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* User message */}
      <div className="flex justify-end">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-sm shadow-sm">
          {item.question}
        </div>
      </div>

      {/* AI response */}
      <div className="flex justify-start">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-full w-full">
          <p className="text-xs font-mono text-gray-400 bg-gray-50 px-3 py-2 rounded-lg mb-3">
            {item.sql}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {item.columns.map((col) => (
                    <th key={col} className="text-left text-xs text-gray-400 font-semibold pb-2 pr-6 uppercase tracking-wide">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.rows.map((row, j) => (
                  <tr key={j} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    {row.map((cell: any, k: number) => (
                      <td key={k} className="py-2 pr-6 text-gray-700 text-sm">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {item.rows.length > 1 && item.columns.length >= 2 && !isNaN(Number(item.rows[0][item.rows[0].length - 1])) && (
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={item.rows.map((row) => ({
                  name: String(row[0]),
                  value: Number(row[row.length - 1])
                }))}>
                  <XAxis dataKey="name" tick={{fontSize: 11, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 11, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="value" fill="url(#gradient)" radius={[6,6,0,0]} />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}