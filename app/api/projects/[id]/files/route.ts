import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"

// Get all files for a project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()

    // Get all files for the project
    const files = await db.collection(COLLECTIONS.FILES)
      .find({ projectId: params.id })
      .toArray()

    return NextResponse.json(
      files.map((file) => ({
        id: file._id.toString(),
        name: file.name,
        path: file.path,
        content: file.content || "",
        projectId: file.projectId,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      }))
    )
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}

// Create a new file
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, path, content } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 })
    }

    // Validate file name
    const fileNameRegex = /^[a-zA-Z0-9._-]+$/
    if (!fileNameRegex.test(name)) {
      return NextResponse.json({ 
        error: "File name can only contain letters, numbers, periods, dashes, and underscores" 
      }, { status: 400 })
    }

    const db = await getDb()

    // Check if file with same name already exists
    const existingFile = await db.collection(COLLECTIONS.FILES).findOne({ 
      projectId: params.id,
      name: name 
    })

    if (existingFile) {
      return NextResponse.json({ error: "A file with this name already exists" }, { status: 400 })
    }

    const file = await db.collection(COLLECTIONS.FILES).insertOne({
      name,
      path: path || "/",
      content: content || "",
      projectId: params.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      id: file.insertedId.toString(),
      name,
      path: path || "/",
      content: content || "",
      projectId: params.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error creating file:", error)
    return NextResponse.json({ error: "Failed to create file" }, { status: 500 })
  }
}

