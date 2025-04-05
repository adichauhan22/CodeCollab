import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/db"
import { COLLECTIONS } from "@/lib/models"

// Get a specific file
export async function GET(
  request: Request,
  context: { params: { id: string; fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()
    const { id, fileId } = context.params

    // Get the file
    const file = await db.collection(COLLECTIONS.FILES).findOne({
      _id: new ObjectId(fileId),
      projectId: id
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: file._id.toString(),
      name: file.name,
      path: file.path,
      content: file.content || "",
      projectId: file.projectId,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    })
  } catch (error) {
    console.error("Error fetching file:", error)
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 })
  }
}

// Update a file
export async function PUT(
  request: Request,
  context: { params: { id: string; fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, name, path } = await request.json()
    const { id, fileId } = context.params

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const db = await getDb()

    // Update the file
    const result = await db.collection(COLLECTIONS.FILES).findOneAndUpdate(
      {
        _id: new ObjectId(fileId),
        projectId: id
      },
      {
        $set: {
          content,
          name: name || undefined,
          path: path || undefined,
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: result._id.toString(),
      name: result.name,
      path: result.path,
      content: result.content,
      projectId: result.projectId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    })
  } catch (error) {
    console.error("Error updating file:", error)
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 })
  }
}

// Delete a file
export async function DELETE(req: NextRequest, { params }: { params: { id: string; fileId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string
    const projectId = params.id
    const fileId = params.fileId

    // Check if user has access to this project
    const hasAccess = await hasProjectAccess(projectId, userId)

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized access to project" }, { status: 403 })
    }

    // Check if file exists
    const file = await findOne(COLLECTIONS.FILES, {
      _id: new ObjectId(fileId),
      projectId: new ObjectId(projectId),
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Record activity before deleting
    await insertOne(COLLECTIONS.ACTIVITIES, {
      type: ActivityType.FILE_DELETED,
      projectId: new ObjectId(projectId),
      userId: new ObjectId(userId),
      metadata: {
        fileName: file.name,
        filePath: file.path,
      },
      createdAt: new Date(),
    })

    // Delete the file
    await deleteOne(COLLECTIONS.FILES, fileId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}

