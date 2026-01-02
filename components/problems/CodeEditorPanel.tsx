"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { CodeEditorRef } from "@/components/editor/CodeEditor";

const CodeEditor = dynamic(
  () => import("@/components/editor/CodeEditor").then(mod => mod.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400">
        Loading editor...
      </div>
    ),
  },
);

interface CodeEditorPanelProps {
  language: string;
  code: string;
  submitting: boolean;
  hasResults: boolean;
  isOutputCollapsed: boolean;
  onLanguageChange: (lang: string) => void;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  onShowIOGuide: () => void;
}

export function CodeEditorPanel({
  language,
  code,
  submitting,
  hasResults,
  isOutputCollapsed,
  onLanguageChange,
  onCodeChange,
  onSubmit,
  onShowIOGuide,
}: CodeEditorPanelProps) {
  const editorRef = useRef<CodeEditorRef>(null);

  return (
    <>
      {/* Header with Language Selector and I/O Guide */}
      <div className="border-b border-slate-700 bg-slate-800/50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={e => onLanguageChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <option value="PYTHON">Python</option>
            <option value="CPP">C++</option>
            <option value="JAVASCRIPT">JavaScript</option>
            <option value="JAVA">Java</option>
          </select>
          <button
            onClick={onShowIOGuide}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-blue-400 text-sm font-medium transition flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            I/O Guide
          </button>
        </div>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-6 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded transition disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? "Running..." : "Submit"}
        </button>
      </div>

      {/* Code Editor - Dynamic height when output exists */}
      <div
        className={hasResults && !isOutputCollapsed ? "h-1/3" : ""}
        style={{
          flex: hasResults && !isOutputCollapsed ? "none" : "1 1 0%",
          minHeight: 0,
        }}>
        <CodeEditor
          ref={editorRef}
          defaultValue={code}
          onChange={value => onCodeChange(value || "")}
          language={
            language.toLowerCase() as "python" | "cpp" | "javascript" | "java"
          }
        />
      </div>
    </>
  );
}
