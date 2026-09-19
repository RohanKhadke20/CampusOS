import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { demoDb } from "@campusos/db";
import {
  GOOGLE_DRIVE_SCOPES,
  CAMPUSOS_DRIVE_FOLDER_NAME,
  getGoogleDriveAuthUrl,
  encryptRefreshToken,
  decryptRefreshToken,
  getDriveProvider,
  DemoLocalDriveProvider,
  GoogleDriveProvider,
  createAuthenticatedGoogleDriveClient,
  mapGoogleDriveError,
} from "@campusos/integrations";
import { GET as getAuthUrlHandler } from "../app/api/google/drive/auth-url/route";
import { GET as statusHandler } from "../app/api/google/drive/status/route";
import { POST as folderHandler } from "../app/api/google/drive/folder/route";
import { GET as listFilesHandler, POST as uploadHandler } from "../app/api/google/drive/files/route";
import { GET as getFileHandler, DELETE as deleteFileHandler } from "../app/api/google/drive/files/[id]/route";
import { POST as disconnectHandler } from "../app/api/google/drive/disconnect/route";
import { POST as callbackHandler } from "../app/api/google/oauth/callback/route";

describe("Google Drive Integration - OAuth Scopes & Security", () => {
  it("should use narrowest practical OAuth scope (drive.file) and NOT broad drive scopes", () => {
    assert.ok(
      GOOGLE_DRIVE_SCOPES.includes("https://www.googleapis.com/auth/drive.file"),
      "Must include narrow per-file drive.file scope"
    );
    assert.equal(
      GOOGLE_DRIVE_SCOPES.includes("https://www.googleapis.com/auth/drive"),
      false,
      "Must NEVER request broad full drive access"
    );
    assert.equal(
      GOOGLE_DRIVE_SCOPES.includes("https://www.googleapis.com/auth/drive.readonly"),
      false,
      "Must not use broad read-only drive access"
    );
  });

  it("should generate valid authorization URL containing drive.file scope and offline access", () => {
    const authUrl = getGoogleDriveAuthUrl("state_drive_123");
    assert.ok(authUrl.includes("https://accounts.google.com/o/oauth2/v2/auth"));
    assert.ok(authUrl.includes("access_type=offline"), "Must request offline access for refresh token");
    assert.ok(authUrl.includes("prompt=consent"), "Must prompt consent to guarantee refresh token");
    assert.ok(authUrl.includes("drive.file"), "Must specify drive.file scope in query");
  });
});

describe("DriveProvider Abstraction & Fallback Local/Demo Provider", () => {
  const userId = "test_student_user_1";

  it("should fallback to DemoLocalDriveProvider when not connected to Google Drive", async () => {
    const provider = getDriveProvider({
      userId,
      forceDemoFallback: true,
    });

    assert.equal(provider.providerName, "demo_fallback");
    const status = await provider.getStatus();
    assert.equal(status.provider, "demo_fallback");
    assert.equal(status.connected, true);
  });

  it("should find or create CampusOS Resources folder in demo provider", async () => {
    const provider = new DemoLocalDriveProvider(userId);
    const folder = await provider.getOrCreateCampusOSFolder();

    assert.ok(folder.id);
    assert.equal(folder.name, CAMPUSOS_DRIVE_FOLDER_NAME);
  });

  it("should upload, list, download, and delete resources in DemoLocalDriveProvider", async () => {
    const provider = new DemoLocalDriveProvider(userId);
    const content = "# Algorithm Design & Analysis\nWeek 1: Master Theorem";

    // 1. Upload
    const uploaded = await provider.uploadResource({
      name: "algorithms_lecture1.md",
      mimeType: "text/markdown",
      content,
    });
    assert.ok(uploaded.id);
    assert.equal(uploaded.name, "algorithms_lecture1.md");
    assert.equal(uploaded.sizeBytes, Buffer.from(content).length);

    // 2. List
    const files = await provider.listFiles();
    const found = files.find((f) => f.id === uploaded.id);
    assert.ok(found, "Uploaded file must appear in file listing");

    // 3. Download content
    const downloaded = await provider.downloadFileContent(uploaded.id);
    assert.equal(downloaded.fileName, "algorithms_lecture1.md");
    assert.equal(downloaded.content.toString("utf8"), content);

    // 4. Delete
    const deleted = await provider.deleteFile(uploaded.id);
    assert.equal(deleted, true);

    const postDeleteFiles = await provider.listFiles();
    assert.equal(postDeleteFiles.some((f) => f.id === uploaded.id), false);
  });
});

describe("Google Drive Endpoints & File Management", () => {
  const studentUserId = "a1111111-1111-4111-8111-111111111111";

  beforeEach(() => {
    demoDb.deleteGoogleConnection(studentUserId);
  });

  it("should return demo fallback status when Google Drive is disconnected", async () => {
    const req = new NextRequest("http://localhost:3000/api/google/drive/status", {
      headers: { "x-test-user-id": studentUserId },
    });
    const res = await statusHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.connected, false);
    assert.equal(json.provider, "demo_fallback");
  });

  it("should connect Google Drive via OAuth exchange and store encrypted refresh token", async () => {
    const req = new NextRequest("http://localhost:3000/api/google/oauth/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": studentUserId,
      },
      body: JSON.stringify({ code: "test_code_drive_oauth" }),
    });

    const res = await callbackHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);

    // Verify token is encrypted in DB and never exposed to client
    assert.equal(json.data.refreshToken, undefined);
    assert.equal(json.data.encryptedRefreshToken, undefined);

    const conn = demoDb.getGoogleConnection(studentUserId);
    assert.ok(conn);
    assert.ok(conn.encryptedRefreshToken.includes(":"), "Stored token must be AES-256-GCM formatted");
  });

  it("should create/verify CampusOS Resources directory via POST /api/google/drive/folder", async () => {
    const req = new NextRequest("http://localhost:3000/api/google/drive/folder", {
      method: "POST",
      headers: { "x-test-user-id": studentUserId },
    });

    const res = await folderHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.name, CAMPUSOS_DRIVE_FOLDER_NAME);
  });

  it("should upload resource, store Drive file ID in database, and list files", async () => {
    const filePayload = {
      name: "Distributed_Systems_Syllabus.txt",
      mimeType: "text/plain",
      content: "Course Outline: Paxos, Raft, Byzantine Fault Tolerance.",
      entityType: "SYLLABUS",
    };

    // 1. Upload via POST /api/google/drive/files
    const uploadReq = new NextRequest("http://localhost:3000/api/google/drive/files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": studentUserId,
      },
      body: JSON.stringify(filePayload),
    });

    const uploadRes = await uploadHandler(uploadReq);
    assert.equal(uploadRes.status, 201);
    const uploadJson = await uploadRes.json();
    assert.equal(uploadJson.success, true);
    assert.ok(uploadJson.data.id, "Must return Drive file ID");
    assert.ok(uploadJson.data.recordId, "Must return local database record ID");

    const driveFileId = uploadJson.data.id;

    // 2. Verify stored in database
    const dbRecord = demoDb.getDriveFileByGoogleId(driveFileId, studentUserId);
    assert.ok(dbRecord, "Must persist Drive file linkage in demoDb");
    assert.equal(dbRecord.googleFileId, driveFileId);
    assert.equal(dbRecord.fileName, filePayload.name);
    assert.equal(dbRecord.entityType, "SYLLABUS");

    // 3. List via GET /api/google/drive/files
    const listReq = new NextRequest("http://localhost:3000/api/google/drive/files", {
      headers: { "x-test-user-id": studentUserId },
    });
    const listRes = await listFilesHandler(listReq);
    assert.equal(listRes.status, 200);
    const listJson = await listRes.json();
    assert.equal(listJson.success, true);
    assert.ok(listJson.data.length >= 1);
    assert.ok(listJson.linkedRecords.length >= 1);

    // 4. Retrieve metadata via GET /api/google/drive/files/:id
    const getReq = new NextRequest(`http://localhost:3000/api/google/drive/files/${driveFileId}`, {
      headers: { "x-test-user-id": studentUserId },
    });
    const getRes = await getFileHandler(getReq, {
      params: Promise.resolve({ id: driveFileId }),
    });
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.equal(getJson.data.name, filePayload.name);

    // 5. Download file via GET /api/google/drive/files/:id?download=true
    const dlReq = new NextRequest(`http://localhost:3000/api/google/drive/files/${driveFileId}?download=true`, {
      headers: { "x-test-user-id": studentUserId },
    });
    const dlRes = await getFileHandler(dlReq, {
      params: Promise.resolve({ id: driveFileId }),
    });
    assert.equal(dlRes.status, 200);
    const dlBody = await dlRes.text();
    assert.equal(dlBody, filePayload.content);

    // 6. Delete file via DELETE /api/google/drive/files/:id
    const delReq = new NextRequest(`http://localhost:3000/api/google/drive/files/${driveFileId}`, {
      method: "DELETE",
      headers: { "x-test-user-id": studentUserId },
    });
    const delRes = await deleteFileHandler(delReq, {
      params: Promise.resolve({ id: driveFileId }),
    });
    assert.equal(delRes.status, 200);

    // Verify local record cleaned up
    const postDbRecord = demoDb.getDriveFileByGoogleId(driveFileId, studentUserId);
    assert.equal(postDbRecord, undefined);
  });

  it("should disconnect Google Drive via POST /api/google/drive/disconnect", async () => {
    // Seed connection
    demoDb.upsertGoogleConnection({
      userId: studentUserId,
      googleUserId: "g_12345",
      email: "test@campusos.edu",
      encryptedRefreshToken: encryptRefreshToken("mock_rt_test"),
      scope: "https://www.googleapis.com/auth/drive.file",
    });

    const discReq = new NextRequest("http://localhost:3000/api/google/drive/disconnect", {
      method: "POST",
      headers: { "x-test-user-id": studentUserId },
    });
    const discRes = await disconnectHandler(discReq);
    assert.equal(discRes.status, 200);
    const discJson = await discRes.json();
    assert.equal(discJson.connected, false);

    const conn = demoDb.getGoogleConnection(studentUserId);
    assert.equal(conn, undefined);
  });
});

describe("Google Drive Error States Verification", () => {
  it("ERROR STATE 1: expired token triggers 401 error", () => {
    const client = createAuthenticatedGoogleDriveClient("test_expired_token");
    const provider = new GoogleDriveProvider("test_expired_token", "user_1");

    return assert.rejects(
      async () => {
        await provider.listFiles();
      },
      (err: any) => {
        assert.equal(err.error, "expired_token");
        assert.equal(err.statusCode, 401);
        return true;
      }
    );
  });

  it("ERROR STATE 2: revoked consent triggers 403 error", () => {
    const provider = new GoogleDriveProvider("test_revoked_consent", "user_1");

    return assert.rejects(
      async () => {
        await provider.listFiles();
      },
      (err: any) => {
        assert.equal(err.error, "revoked_consent");
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  it("ERROR STATE 3: API quota exceeded triggers 429 error", () => {
    const provider = new GoogleDriveProvider("test_api_quota", "user_1");

    return assert.rejects(
      async () => {
        await provider.listFiles();
      },
      (err: any) => {
        assert.equal(err.error, "api_quota");
        assert.equal(err.statusCode, 429);
        return true;
      }
    );
  });

  it("ERROR STATE 4: insufficient scope triggers 403 error", () => {
    const provider = new GoogleDriveProvider("test_insufficient_scope", "user_1");

    return assert.rejects(
      async () => {
        await provider.listFiles();
      },
      (err: any) => {
        assert.equal(err.error, "insufficient_scope");
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  it("ERROR STATE 5: file not found triggers 404 error", () => {
    const err = mapGoogleDriveError({ status: 404, message: "File not found" });
    assert.equal(err.error, "file_not_found");
    assert.equal(err.statusCode, 404);
  });
});
