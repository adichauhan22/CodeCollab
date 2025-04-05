"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import CodeEditor from "@/components/editor/code-editor"
import CollaboratorsList from "@/components/editor/collaborators-list"
import ChatPanel from "@/components/editor/chat-panel"
import { toast } from "@/components/ui/use-toast"
import { useRouter, useParams } from "next/navigation"
import { PlusIcon, Share2Icon } from "lucide-react"
import { ProjectChat } from "@/components/chat/ProjectChat"
import { Editor } from "@/components/editor/Editor"

interface Project {
  id: string
  name: string
  description: string
  language: string
  shareCode: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string
    image: string
  }
  isOwned: boolean
  collaborators: {
    id: string
    name: string
    image: string
    role: string
    online: boolean
  }[]
  files: {
    id: string
    name: string
    path: string
    updatedAt: string
  }[]
}

interface File {
  id: string
  name: string
  path: string
  content: string
  projectId: string
  createdAt: string
  updatedAt: string
}

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [activeFile, setActiveFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    let isMounted = true

    async function fetchProject() {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch project details
        const response = await fetch(`/api/projects/${params.id}`)
        if (!response.ok) {
          throw new Error(response.status === 404 ? "Project not found" : "Failed to fetch project")
        }
        const projectData = await response.json()
        if (isMounted) setProject(projectData)

        // Fetch files
        const filesResponse = await fetch(`/api/projects/${params.id}/files`)
        if (!filesResponse.ok) {
          throw new Error("Failed to fetch files")
        }
        const filesData = await filesResponse.json()
        if (isMounted) setFiles(filesData)

        // Set active file if there are files
        if (filesData.length > 0) {
          const fileResponse = await fetch(`/api/projects/${params.id}/files/${filesData[0].id}`)
          if (fileResponse.ok) {
            const fileData = await fileResponse.json()
            if (isMounted) setActiveFile(fileData)
          }
        }
      } catch (error) {
        console.error("Error fetching project:", error)
        if (isMounted) {
          setError(error instanceof Error ? error.message : "An error occurred")
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchProject()

    return () => {
      isMounted = false
    }
  }, [params.id])

  const handleFileClick = async (fileId: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/files/${fileId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch file")
      }

      const fileData = await response.json()
      setActiveFile({
        id: fileData.id,
        name: fileData.name,
        path: fileData.path,
        content: fileData.content || "",
        projectId: fileData.projectId,
        createdAt: fileData.createdAt,
        updatedAt: fileData.updatedAt,
      })
    } catch (error) {
      console.error("Error fetching file:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load file",
        variant: "destructive",
      })
    }
  }

  const handleShareProject = () => {
    if (project) {
      navigator.clipboard.writeText(project.shareCode)
      toast({
        title: "Share Code Copied",
        description: `Share code "${project.shareCode}" copied to clipboard`,
      })
    }
  }

  const handleCreateFile = async () => {
    try {
      const name = prompt("Enter file name:")
      if (!name) return

      // Validate file name
      const fileNameRegex = /^[a-zA-Z0-9._-]+$/
      if (!fileNameRegex.test(name)) {
        toast({
          title: "Error",
          description: "File name can only contain letters, numbers, periods, dashes, and underscores",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/projects/${params.id}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          content: "",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create file")
      }

      // Update project files list
      setProject(prev => ({
        ...prev!,
        files: [...prev!.files, {
          id: data.id,
          name: data.name,
          path: data.path,
          updatedAt: data.updatedAt,
        }],
      }))

      // Set the new file as active
      setActiveFile({
        id: data.id,
        name: data.name,
        path: data.path,
        content: data.content,
        projectId: data.projectId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })

      toast({
        title: "Success",
        description: `File "${name}" created successfully`,
      })
    } catch (error) {
      console.error("Error creating file:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create file",
        variant: "destructive",
      })
    }
  }

  const handleRunProject = async () => {
    try {
      setIsRunning(true)
      const response = await fetch(`/api/projects/${params.id}/run`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to run project")
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // For HTML projects, open the preview URL
      if (data.url) {
        window.open(data.url, "_blank")
      }
    } catch (error) {
      console.error("Error running project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run project",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleSaveFile = async () => {
    if (!activeFile) return

    try {
      const response = await fetch(`/api/projects/${params.id}/files/${activeFile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: activeFile.content,
          name: activeFile.name,
          path: activeFile.path,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save file")
      }

      const updatedFile = await response.json()
      
      // Update the active file with the new data
      setActiveFile(updatedFile)
      
      // Update the file in the project's files list
      setProject((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          files: prev.files.map((file) =>
            file.id === updatedFile.id ? updatedFile : file
          ),
        }
      })

      toast({
        title: "Success",
        description: "File saved successfully",
      })
    } catch (error) {
      console.error("Error saving file:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save file",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Project Not Found</h2>
        <p className="text-muted-foreground">
          The project you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button className="mt-4" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{project.language}</Badge>
              <span className="text-xs text-muted-foreground">
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {project.collaborators.slice(0, 3).map((collaborator) => (
              <div key={collaborator.id} className="relative">
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarImage
                    src={collaborator.image || `/placeholder.svg?height=32&width=32`}
                    alt={collaborator.name}
                  />
                  <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {collaborator.online && (
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white" />
                )}
              </div>
            ))}
            {project.collaborators.length > 3 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                +{project.collaborators.length - 3}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleShareProject}>
            <Share2Icon className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button size="sm" onClick={handleRunProject} disabled={isRunning}>
            {isRunning ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Running...
              </>
            ) : (
              "Run"
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r bg-muted/40">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Files</h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCreateFile}>
                <PlusIcon className="h-4 w-4" />
                <span className="sr-only">Add File</span>
              </Button>
            </div>
            <div className="space-y-1">
              {project.files.map((file) => (
                <div
                  key={file.id}
                  className={`flex cursor-pointer items-center rounded-md px-2 py-1 text-sm ${
                    activeFile && file.id === activeFile.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                  }`}
                  onClick={() => handleFileClick(file.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {file.name}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t p-4">
            <CollaboratorsList collaborators={project.collaborators} />
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <Tabs defaultValue="editor" className="flex-1">
            <div className="border-b">
              <div className="flex items-center px-4">
                <TabsList className="h-10">
                  <TabsTrigger value="editor" className="relative">
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
              </div>
            </div>
            <TabsContent value="editor" className="flex-1 p-0 data-[state=active]:flex">
              {activeFile ? (
                <div className="h-full flex flex-col">
                  <div className="border-b p-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{activeFile.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveFile}
                    >
                      Save
                    </Button>
                  </div>
                  <div className="flex-1 relative">
                    <Editor
                      value={activeFile.content || ""}
                      onChange={(value) => {
                        setActiveFile((prev) =>
                          prev ? { ...prev, content: value } : null
                        )
                      }}
                      language={getLanguageFromFileName(activeFile.name)}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Select a file to edit</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="preview" className="h-full flex-1 p-0">
              <div className="flex h-full items-center justify-center bg-muted/50">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Preview</h3>
                  <p className="text-sm text-muted-foreground">Preview will be shown here when you run the project.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-80 border-l">
          <ProjectChat
            projectId={params.id}
            projectName={project?.name || ""}
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}

// Helper function to determine language from file name
function getLanguageFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'js':
      return 'javascript'
    case 'ts':
      return 'typescript'
    case 'jsx':
      return 'javascript'
    case 'tsx':
      return 'typescript'
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'json':
      return 'json'
    case 'md':
      return 'markdown'
    default:
      return 'plaintext'
  }
}

