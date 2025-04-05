import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface Message {
  id: string
  content: string
  senderId: string
  projectId: string
  createdAt: string
  updatedAt: string
  sender: {
    id: string
    name: string
    image: string | null
  }
}

interface ProjectChatProps {
  projectId: string
  projectName: string
  className?: string
}

export function ProjectChat({ projectId, projectName, className = "" }: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [projectId])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/messages/projects/${projectId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }
      const data = await response.json()
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast.error("Failed to load messages")
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const response = await fetch(`/api/messages/projects/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newMessage }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const message = await response.json()
      setMessages((prev) => [...prev, message])
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">{projectName}</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender.image || undefined} />
                  <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{message.sender.name}</p>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendMessage()
              }
            }}
          />
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
      </div>
    </div>
  )
} 