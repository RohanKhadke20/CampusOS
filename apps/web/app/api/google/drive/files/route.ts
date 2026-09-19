import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";
import { getDriveProvider } from "@campusos/integrations";

/**
 * GET /api/google/drive/files
 * Lists CampusOS linked resources / files.
 * Supports filtering by entityType or folderId.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to list files." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;

    const connection = demoDb.getGoogleConnection(user.id);
    const hasDrive = connection && connection.scope.includes("drive.file");

    const provider = getDriveProvider({
      encryptedRefreshToken: hasDrive ? connection.encryptedRefreshToken : undefined,
      userId: user.id,
      userEmail: connection?.email || user.email,
    });

    // 1. Fetch remote files from provider
    const files = await provider.listFiles(folderId);

    // 2. Query recorded database linkages
    const dbFiles = demoDb.getDriveFiles(user.id, entityType, entityId);

    return NextResponse.json({
      success: true,
      provider: provider.providerName,
      data: files,
      linkedRecords: dbFiles,
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.error || "unknown_error",
        message: error.message || "Failed to list Google Drive files.",
      },
      { status }
    );
  }
}

/**
 * POST /api/google/drive/files
 * Uploads a file/resource to Drive and stores the Drive file ID in CampusOS database.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to upload resource." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      mimeType = "text/plain",
      content,
      parentId,
      description,
      entityType,
      entityId,
    } = body;

    if (!name || content === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "validation_error",
          message: "Both 'name' and 'content' are required for upload.",
        },
        { status: 400 }
      );
    }

    const connection = demoDb.getGoogleConnection(user.id);
    const hasDrive = connection && connection.scope.includes("drive.file");

    const provider = getDriveProvider({
      encryptedRefreshToken: hasDrive ? connection.encryptedRefreshToken : undefined,
      userId: user.id,
      userEmail: connection?.email || user.email,
    });

    // 1. Upload file via DriveProvider
    const uploaded = await provider.uploadResource({
      name,
      mimeType,
      content,
      parentId,
      description,
    });

    // 2. Store Drive file ID and metadata in database
    const dbRecord = demoDb.createDriveFile({
      userId: user.id,
      googleFileId: uploaded.id,
      fileName: uploaded.name,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeBytes,
      webViewLink: uploaded.webViewLink,
      webContentLink: uploaded.webContentLink,
      thumbnailLink: uploaded.thumbnailLink,
      entityType: entityType || "RESOURCE",
      entityId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Resource successfully uploaded and linked.",
        provider: provider.providerName,
        data: {
          ...uploaded,
          recordId: dbRecord.id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.error || "upload_failed",
        message: error.message || "Failed to upload resource to Drive.",
      },
      { status }
    );
  }
}
