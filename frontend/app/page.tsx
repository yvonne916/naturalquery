"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import PreviewTable from "./components/PreviewTable";
import ChatMessage from "./components/ChatMessage";
import QueryInput from "./components/QueryInput";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [tableInfos, setTableInfos] = useState<{[key: string]: any}>({});
  const [datasets, setDatasets] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{role: string, content: string}[]>([]);
  const [chatHistory, setChatHistory] = useState<{question: string, sql: string, rows: any[], columns: string[]}[]>([]);

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    await uploadFiles(newFiles);
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return;

    const existingNames = datasets;
    const newFileNames = filesToUpload.map(f => f.name.replace(".csv", "").replace(" ", "_").toLowerCase());
    
    const duplicates = newFileNames.filter(name => existingNames.includes(name));
    if (duplicates.length > 0) {
      alert(`These files already exist: ${duplicates.join(", ")}`);
      return;
    }
    
    const formData = new FormData();
    for (let i = 0; i < filesToUpload.length; i++) {
      formData.append("files", filesToUpload[i]);
    }

    try {
      const res = await fetch(API_URL + "/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) return;
      
      const data = await res.json();
      
      setDatasets(data.tables);
      if (data.tables.length > 0 && !selectedDataset) {
        setSelectedDataset(data.tables[0]);
      }
      
      setTableInfos(data.table_infos);
      setHistory([]);
      setChatHistory([]);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    
    const fileToRemove = files[index].name.replace(".csv", "").replace(" ", "_").toLowerCase();
    const newDatasets = datasets.filter(d => d !== fileToRemove);
    setDatasets(newDatasets);
    
    if (selectedDataset === fileToRemove) {
      setSelectedDataset(newDatasets.length > 0 ? newDatasets[0] : "");
    }
    
    if (newDatasets.length === 0) {
      setTableInfos({});
    }
  };

  const previewData = selectedDataset ? tableInfos[selectedDataset] : null;

  const handleQuery = async () => {
    if (!question || !selectedDataset) return;
    setLoading(true);
    const res = await fetch(API_URL + "/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        table: selectedDataset,
        history,
      }),
    });
    const data = await res.json();
    setHistory([
      ...history,
      { role: "user", content: question },
      { role: "assistant", content: `SQL: ${data.sql}, Results: ${JSON.stringify(data.rows)}` }
    ]);
    setChatHistory([...chatHistory, {
      question,
      sql: data.sql,
      rows: data.rows,
      columns: data.columns
    }]);
    setQuestion("");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">N</div>
          <h1 className="text-lg font-semibold text-gray-900">NaturalQuery</h1>
          <span className="text-xs text-gray-400 ml-1">AI-powered data analysis</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 flex gap-8">
        <Sidebar
          files={files}
          datasets={datasets}
          selectedDataset={selectedDataset}
          onFileChange={handleFileChange}
          onRemoveFile={removeFile}
          onSelectDataset={setSelectedDataset}
        />

        <div className="flex-1 min-w-0">
          {!selectedDataset ? (
            <div className="flex flex-col items-center justify-center h-96 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Upload CSV files to get started</p>
              <p className="text-xs text-gray-400">Ask questions about your data in plain English</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {previewData && (
                <PreviewTable
                  tableName={selectedDataset}
                  columns={previewData.columns}
                  rows={previewData.preview}
                  rowCount={previewData.row_count}
                />
              )}

              {chatHistory.map((item, i) => (
                <ChatMessage key={i} item={item} />
              ))}

              <QueryInput
                value={question}
                loading={loading}
                disabled={!selectedDataset}
                onChange={setQuestion}
                onSubmit={handleQuery}
                onKeyDown={(e) => e.key === "Enter" && handleQuery()}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}