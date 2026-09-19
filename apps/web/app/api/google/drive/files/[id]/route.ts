import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";
import { getDriveProvider } from "@campusos/integrations";

/**
 * GET /api/google/drive/files/:id
 * Fetches file metadata, webViewLink, or raw file content for download.
 * Query param: `download=true` returns raw media stream/buffer.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { id: fileId } = await params;
    const { searchParams } = new URL(request.url);
    const wantsDownload = searchParams.get("download") === "true";

    const connection = demoDb.getGoogleConnection(user.id);
    const hasDrive = connection && connection.scope.includes("drive.file");

    const provider = getDriveProvider({
      encryptedRefreshToken: hasDrive ? connection.encryptedRefreshToken : undefined,
      userId: user.id,
      userEmail: connection?.email || user.email,
    });

    if (wantsDownload) {
      const downloaded = await provider.downloadFileContent(fileId);
      return new NextResponse(new Uint8Array(downloaded.content), {
        headers: {
          "Content-Type": downloaded.mimeType,
          "Content-Disposition": `attachment; filename="${downloaded.fileName}"`,
        },
      });
    }

    const file = await provider.getFile(fileId);
    const dbRecord = demoDb.getDriveFileByGoogleId(fileId, user.id);

    return NextResponse.json({
      success: true,
      provider: provider.providerName,
      data: {
        ...file,
        recordId: dbRecord?.id,
        entityType: dbRecord?.entityType,
        entityId: dbRecord?.entityId,
      },
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.error || "file_not_found",
        message: error.message || "Failed to retrieve Drive file.",
      },
      { status }
    );
  }
}

/**
 * DELETE /api/google/drive/files/:id
 * Deletes file on Drive and cleans up local database record.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { id: fileId } = await params;

    const connection = demoDb.getGoogleConnection(user.id);
    const hasDrive = connection && connection.scope.includes("drive.file");

    const provider = getDriveProvider({
      encryptedRefreshToken: hasDrive ? connection.encryptedRefreshToken : undefined,
      userId: user.id,
      userEmail: connection?.email || user.email,
    });

    await provider.deleteFile(fileId);

    // Also clean up local DB reference if exists
    const dbRecord = demoDb.getDriveFileByGoogleId(fileId, user.id);
    if (dbRecord) {
      demoDb.deleteDriveFile(dbRecord.id, user.id);
    }

    return NextResponse.json({
      success: true,
      message: "Drive file deleted successfully.",
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.error || "unknown_error",
        message: error.message || "Failed to delete Drive file.",
      },
      { status }
    );
  }
}
