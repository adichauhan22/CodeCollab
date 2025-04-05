"use client"

import { useState, useEffect } from "react"

interface File {
  id: string
  name: string
  path: string
  content: string
}

interface CodeEditorProps {
  file: File
}

export default function CodeEditor({ file }: CodeEditorProps) {
  const [content, setContent] = useState(file.content)
  const [activeUsers, setActiveUsers] = useState<{ id: string; name: string; position: number }[]>([
    { id: "2", name: "Jane Smith", position: 5 },
  ])

  // Simulate cursor positions of other users
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers((users) =>
        users.map((user) => ({
          ...user,
          position: Math.floor(Math.random() * content.length),
        })),
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [content.length])

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-1.5 text-sm">
        <div className="flex items-center">
          <span className="font-medium">{file.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {activeUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              {user.name} is editing
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-1">
        <div className="w-12 flex-none bg-muted/30 text-right">
          {content.split("\n").map((_, i) => (
            <div key={i} className="px-2 py-0.5 text-xs text-muted-foreground">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 resize-none bg-background p-0.5 font-mono text-sm focus:outline-none"
          style={{ lineHeight: "1.5", padding: "0.125rem 0.5rem" }}
        />
      </div>
      <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-1 text-xs text-muted-foreground">
        <div>JavaScript</div>
        <div>
          Ln {content.split("\n").length}, Col {content.split("\n")[content.split("\n").length - 1].length}
        </div>
      </div>
    </div>
  )
}

