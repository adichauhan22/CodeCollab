"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { editor } from "monaco-editor"
import { useTheme } from "next-themes"
import { Loader2 } from "lucide-react"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
})

interface EditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  readOnly?: boolean
}

export function Editor({ value, onChange, language = "javascript", readOnly = false }: EditorProps) {
  const { theme } = useTheme()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    setIsEditorReady(true)
  }

  const handleEditorWillMount = (monaco: typeof import("monaco-editor")) => {
    monaco.editor.defineTheme("vs-dark-custom", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1a1a1a",
      },
    })
  }

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value)
    }
  }, [value])

  return (
    <div className="h-full w-full">
      <MonacoEditor
        height="100%"
        defaultLanguage={language}
        value={value}
        onChange={(value) => onChange(value || "")}
        theme={theme === "dark" ? "vs-dark-custom" : "light"}
        onMount={handleEditorDidMount}
        beforeMount={handleEditorWillMount}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          wordWrap: "on",
          tabSize: 2,
          readOnly,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: "on",
          cursorBlinking: "smooth",
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          formatOnPaste: true,
          formatOnType: true,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          tabCompletion: "on",
          wordBasedSuggestions: true,
          parameterHints: { enabled: true },
          renderWhitespace: "selection",
          renderLineHighlight: "all",
          renderValidationDecorations: "on",
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
      />
    </div>
  )
} 