"use client";

import { useRef, useImperativeHandle, forwardRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

interface CodeEditorProps {
  language: "python" | "cpp" | "javascript" | "java";
  defaultValue?: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  theme?: "vs-dark" | "github-dark";
}

export interface CodeEditorRef {
  formatDocument: () => void;
}

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  function CodeEditor(
    { language, defaultValue, onChange, readOnly = false, theme = "vs-dark" },
    ref,
  ) {
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

    const languageMap = {
      python: "python",
      cpp: "cpp",
      javascript: "javascript",
      java: "java",
    };

    useImperativeHandle(ref, () => ({
      formatDocument: () => {
        if (editorRef.current) {
          editorRef.current.getAction("editor.action.formatDocument")?.run();
        }
      },
    }));

    const handleEditorDidMount: OnMount = (editor, monaco) => {
      editorRef.current = editor;

      // Enable IntelliSense and autocomplete
      editor.updateOptions({
        fontSize: 14,
        fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        renderLineHighlight: "all",
        lineNumbers: "on",
        glyphMargin: true,
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
        automaticLayout: true,
        // IntelliSense settings
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnCommitCharacter: true,
        acceptSuggestionOnEnter: "on",
        tabCompletion: "on",
        wordBasedSuggestions: "matchingDocuments",
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
      });

      // Add keyboard shortcut for formatting (Shift+Alt+F)
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
        () => {
          editor.getAction("editor.action.formatDocument")?.run();
        },
      );

      monaco.editor.defineTheme("github-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#0d1117",
          "editor.foreground": "#c9d1d9",
          "editor.lineHighlightBackground": "#161b22",
          "editorLineNumber.foreground": "#6e7681",
          "editorLineNumber.activeForeground": "#c9d1d9",
        },
      });
    };

    return (
      <div className="h-full w-full border border-border overflow-hidden">
        <Editor
          height="100%"
          language={languageMap[language]}
          defaultValue={defaultValue}
          theme={theme}
          onChange={onChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
          options={{
            readOnly,
            scrollbar: {
              vertical: "visible",
              horizontal: "visible",
              useShadows: false,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
          }}
        />
      </div>
    );
  },
);
