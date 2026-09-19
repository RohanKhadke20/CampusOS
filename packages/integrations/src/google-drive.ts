import crypto from "crypto";
import { google, drive_v3 } from "googleapis";
import {
  getEncryptionKey,
  encryptRefreshToken,
  decryptRefreshToken,
  getGoogleOAuth2Client,
} from "./google-calendar";

/**
 * Narrowest practical OAuth scopes for Google Drive per-file access.
 * We strictly use 'https://www.googleapis.com/auth/drive.file' (per-file access created or opened by the app).
 * We NEVER use the broad 'https://www.googleapis.com/auth/drive' scope.
 */
export const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "openid",
  "email",
  "profile",
];

export const CAMPUSOS_DRIVE_FOLDER_NAME = "CampusOS Resources";

export type DriveErrorCode =
  | "disconnected"
  | "expired_token"
  | "revoked_consent"
  | "api_quota"
  | "insufficient_scope"
  | "file_not_found"
  | "folder_creation_failed"
  | "upload_failed"
  | "unknown_error";

export interface DriveError {
  error: DriveErrorCode;
  message: string;
  statusCode: number;
}

export interface DriveFileInfo {
  id: string; // Drive file ID
  name: string;
  mimeType: string;
  sizeBytes?: number;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  parentId?: string;
  createdAt?: string;
  isFolder?: boolean;
}

export interface DriveUploadOptions {
  name: string;
  mimeType: string;
  content: string | Buffer; // text or binary content
  parentId?: string; // Target folder ID
  description?: string;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

/**
 * DriveProvider interface
 * Abstract contract allowing both real Google Drive (with drive.file scope)
 * and fallback local/demo storage provider.
 */
export interface DriveProvider {
  readonly providerName: "google_drive" | "demo_fallback";

  /**
   * Returns connection status or validates current credentials.
   */
  getStatus(): Promise<{
    connected: boolean;
    provider: "google_drive" | "demo_fallback";
    email?: string;
    folderId?: string;
  }>;

  /**
   * Finds or creates the default "CampusOS Resources" directory.
   */
  getOrCreateCampusOSFolder(): Promise<DriveFolderInfo>;

  /**
   * Uploads a file/resource into the specified folder (or the default CampusOS folder).
   */
  uploadResource(options: DriveUploadOptions): Promise<DriveFileInfo>;

  /**
   * Lists files linked to CampusOS or in the CampusOS folder.
   */
  listFiles(folderId?: string): Promise<DriveFileInfo[]>;

  /**
   * Retrieves metadata and direct open/download links for a file by its Drive ID.
   */
  getFile(fileId: string): Promise<DriveFileInfo>;

  /**
   * Reads raw file content for download/preview.
   */
  downloadFileContent(fileId: string): Promise<{
    content: Buffer;
    mimeType: string;
    fileName: string;
  }>;

  /**
   * Deletes a file by its ID.
   */
  deleteFile(fileId: string): Promise<boolean>;
}

/**
 * Generates OAuth authorization consent URL with drive.file scope.
 */
export function getGoogleDriveAuthUrl(state?: string): string {
  const oauth2Client = getGoogleOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_DRIVE_SCOPES,
    state,
  });
}

/**
 * Maps Google Drive API exceptions to standard CampusOS error states.
 */
export function mapGoogleDriveError(err: any): DriveError {
  // If already mapped, return directly
  if (err && typeof err === "object" && "error" in err && "statusCode" in err && "message" in err) {
    return err as DriveError;
  }

  const message = err?.message || String(err);
  const status = err?.status || err?.code || 500;

  if (
    message.includes("invalid_grant") ||
    message.includes("revoked") ||
    message.includes("unauthorized_client") ||
    message.includes("Token has been expired or revoked")
  ) {
    return {
      error: "revoked_consent",
      message: "Google Drive authorization has been revoked or expired. Please reconnect your account.",
      statusCode: 403,
    };
  }

  if (message.includes("expired_token") || message.includes("Invalid Credentials") || status === 401) {
    return {
      error: "expired_token",
      message: "Google Drive access token has expired and could not be renewed.",
      statusCode: 401,
    };
  }

  if (
    message.includes("insufficient") ||
    message.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
    message.includes("Insufficient Permission")
  ) {
    return {
      error: "insufficient_scope",
      message: "Insufficient permissions granted. The drive.file scope is required to manage CampusOS files.",
      statusCode: 403,
    };
  }

  if (
    status === 429 ||
    message.includes("quotaExceeded") ||
    message.includes("rateLimitExceeded") ||
    message.includes("userRateLimitExceeded")
  ) {
    return {
      error: "api_quota",
      message: "Google Drive API rate limit or quota exceeded. Please try again later.",
      statusCode: 429,
    };
  }

  if (status === 404 || message.includes("File not found") || message.includes("notFound")) {
    return {
      error: "file_not_found",
      message: "Requested file or folder was not found on Google Drive.",
      statusCode: 404,
    };
  }

  if (message.includes("disconnected") || message.includes("not connected")) {
    return {
      error: "disconnected",
      message: "Google account is not connected. Please authorize Google Drive.",
      statusCode: 404,
    };
  }

  return {
    error: "unknown_error",
    message: message || "An unexpected error occurred while communicating with Google Drive.",
    statusCode: typeof status === "number" && status >= 400 && status < 600 ? status : 500,
  };
}

// In-memory mock storage for test simulation & demo fallback
interface MockDriveEntry {
  id: string;
  name: string;
  mimeType: string;
  content: Buffer;
  sizeBytes: number;
  parentId?: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
  createdAt: string;
  isFolder: boolean;
}

const mockDriveStorage = new Map<string, Map<string, MockDriveEntry>>();

function getMockStorageForUser(userId: string): Map<string, MockDriveEntry> {
  if (!mockDriveStorage.has(userId)) {
    const userStore = new Map<string, MockDriveEntry>();

    // Pre-populate default folder & a sample resource
    const folderId = `folder_root_${userId.substring(0, 8)}`;
    userStore.set(folderId, {
      id: folderId,
      name: CAMPUSOS_DRIVE_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
      content: Buffer.from(""),
      sizeBytes: 0,
      webViewLink: `https://drive.google.com/drive/folders/${folderId}`,
      webContentLink: `https://drive.google.com/drive/folders/${folderId}`,
      createdAt: new Date().toISOString(),
      isFolder: true,
    });

    const sampleFileId = `file_sample_${userId.substring(0, 8)}`;
    const sampleBuffer = Buffer.from(
      "# CS101 Syllabus\n\nIntroduction to Computer Science & Data Structures.\nCourse Code: CS101\nTerm: Fall 2026",
      "utf8"
    );
    userStore.set(sampleFileId, {
      id: sampleFileId,
      name: "CS101_Syllabus_2026.pdf",
      mimeType: "application/pdf",
      content: sampleBuffer,
      sizeBytes: sampleBuffer.length,
      parentId: folderId,
      webViewLink: `https://drive.google.com/file/d/${sampleFileId}/view`,
      webContentLink: `https://drive.google.com/uc?id=${sampleFileId}&export=download`,
      thumbnailLink: `https://drive.google.com/thumbnail?id=${sampleFileId}`,
      createdAt: new Date().toISOString(),
      isFolder: false,
    });

    mockDriveStorage.set(userId, userStore);
  }
  return mockDriveStorage.get(userId)!;
}

/**
 * Fallback Local/Demo Resource Provider
 * Implements DriveProvider entirely in-memory with file storage simulation
 * for offline, demo, and unauthenticated development workflows.
 */
export class DemoLocalDriveProvider implements DriveProvider {
  readonly providerName = "demo_fallback" as const;
  private userId: string;

  constructor(userId: string = "demo_user") {
    this.userId = userId;
  }

  async getStatus() {
    return {
      connected: true,
      provider: "demo_fallback" as const,
      email: "demo-storage@campusos.internal",
      folderId: `folder_root_${this.userId.substring(0, 8)}`,
    };
  }

  async getOrCreateCampusOSFolder(): Promise<DriveFolderInfo> {
    const store = getMockStorageForUser(this.userId);
    for (const entry of store.values()) {
      if (entry.isFolder && entry.name === CAMPUSOS_DRIVE_FOLDER_NAME) {
        return {
          id: entry.id,
          name: entry.name,
          webViewLink: entry.webViewLink,
        };
      }
    }

    const newFolderId = `folder_root_${Date.now()}`;
    store.set(newFolderId, {
      id: newFolderId,
      name: CAMPUSOS_DRIVE_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
      content: Buffer.from(""),
      sizeBytes: 0,
      webViewLink: `https://drive.google.com/drive/folders/${newFolderId}`,
      webContentLink: `https://drive.google.com/drive/folders/${newFolderId}`,
      createdAt: new Date().toISOString(),
      isFolder: true,
    });

    return {
      id: newFolderId,
      name: CAMPUSOS_DRIVE_FOLDER_NAME,
      webViewLink: `https://drive.google.com/drive/folders/${newFolderId}`,
    };
  }

  async uploadResource(options: DriveUploadOptions): Promise<DriveFileInfo> {
    const store = getMockStorageForUser(this.userId);
    let parentFolderId = options.parentId;

    if (!parentFolderId) {
      const folder = await this.getOrCreateCampusOSFolder();
      parentFolderId = folder.id;
    }

    const contentBuffer = Buffer.isBuffer(options.content)
      ? options.content
      : Buffer.from(options.content, "utf8");

    const fileId = `drive_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: MockDriveEntry = {
      id: fileId,
      name: options.name,
      mimeType: options.mimeType || "application/octet-stream",
      content: contentBuffer,
      sizeBytes: contentBuffer.length,
      parentId: parentFolderId,
      webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink: `https://drive.google.com/uc?id=${fileId}&export=download`,
      thumbnailLink: options.mimeType.startsWith("image/")
        ? `https://drive.google.com/thumbnail?id=${fileId}`
        : undefined,
      createdAt: new Date().toISOString(),
      isFolder: false,
    };

    store.set(fileId, newEntry);

    return {
      id: newEntry.id,
      name: newEntry.name,
      mimeType: newEntry.mimeType,
      sizeBytes: newEntry.sizeBytes,
      webViewLink: newEntry.webViewLink,
      webContentLink: newEntry.webContentLink,
      thumbnailLink: newEntry.thumbnailLink,
      parentId: newEntry.parentId,
      createdAt: newEntry.createdAt,
      isFolder: false,
    };
  }

  async listFiles(folderId?: string): Promise<DriveFileInfo[]> {
    const store = getMockStorageForUser(this.userId);
    let targetFolder = folderId;

    if (!targetFolder) {
      const folder = await this.getOrCreateCampusOSFolder();
      targetFolder = folder.id;
    }

    const results: DriveFileInfo[] = [];
    for (const entry of store.values()) {
      if (!entry.isFolder && (!targetFolder || entry.parentId === targetFolder)) {
        results.push({
          id: entry.id,
          name: entry.name,
          mimeType: entry.mimeType,
          sizeBytes: entry.sizeBytes,
          webViewLink: entry.webViewLink,
          webContentLink: entry.webContentLink,
          thumbnailLink: entry.thumbnailLink,
          parentId: entry.parentId,
          createdAt: entry.createdAt,
          isFolder: false,
        });
      }
    }

    return results;
  }

  async getFile(fileId: string): Promise<DriveFileInfo> {
    const store = getMockStorageForUser(this.userId);
    const entry = store.get(fileId);
    if (!entry) {
      throw mapGoogleDriveError({ status: 404, message: "File not found in local demo store" });
    }

    return {
      id: entry.id,
      name: entry.name,
      mimeType: entry.mimeType,
      sizeBytes: entry.sizeBytes,
      webViewLink: entry.webViewLink,
      webContentLink: entry.webContentLink,
      thumbnailLink: entry.thumbnailLink,
      parentId: entry.parentId,
      createdAt: entry.createdAt,
      isFolder: entry.isFolder,
    };
  }

  async downloadFileContent(fileId: string): Promise<{
    content: Buffer;
    mimeType: string;
    fileName: string;
  }> {
    const store = getMockStorageForUser(this.userId);
    const entry = store.get(fileId);
    if (!entry) {
      throw mapGoogleDriveError({ status: 404, message: "File not found" });
    }

    return {
      content: entry.content,
      mimeType: entry.mimeType,
      fileName: entry.name,
    };
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const store = getMockStorageForUser(this.userId);
    return store.delete(fileId);
  }
}

/**
 * Google Drive Provider
 * Uses Google Drive API v3 restricted to 'drive.file' scope.
 * Only accesses files created by this application.
 */
export class GoogleDriveProvider implements DriveProvider {
  readonly providerName = "google_drive" as const;
  private drive: drive_v3.Drive;
  private userEmail?: string;
  private userId: string;

  constructor(decryptedRefreshToken: string, userId: string, userEmail?: string) {
    this.userId = userId;
    this.userEmail = userEmail;
    this.drive = createAuthenticatedGoogleDriveClient(decryptedRefreshToken, userId);
  }

  async getStatus() {
    return {
      connected: true,
      provider: "google_drive" as const,
      email: this.userEmail,
    };
  }

  async getOrCreateCampusOSFolder(): Promise<DriveFolderInfo> {
    try {
      // Query for existing folder with name 'CampusOS Resources' and mimeType folder
      // drive.file scope allows querying files/folders created by this app
      const listRes = await this.drive.files.list({
        q: `mimeType = 'application/vnd.google-apps.folder' and name = '${CAMPUSOS_DRIVE_FOLDER_NAME}' and trashed = false`,
        fields: "files(id, name, webViewLink)",
        spaces: "drive",
      });

      const existingFolder = listRes.data.files?.[0];
      if (existingFolder && existingFolder.id) {
        return {
          id: existingFolder.id,
          name: existingFolder.name || CAMPUSOS_DRIVE_FOLDER_NAME,
          webViewLink: existingFolder.webViewLink ?? undefined,
        };
      }

      // If not found, create new folder
      const createRes = await this.drive.files.create({
        requestBody: {
          name: CAMPUSOS_DRIVE_FOLDER_NAME,
          mimeType: "application/vnd.google-apps.folder",
          description: "CampusOS University Operating System resource store",
        },
        fields: "id, name, webViewLink",
      });

      if (!createRes.data.id) {
        throw new Error("Failed to create CampusOS Resources folder on Google Drive");
      }

      return {
        id: createRes.data.id,
        name: createRes.data.name || CAMPUSOS_DRIVE_FOLDER_NAME,
        webViewLink: createRes.data.webViewLink ?? undefined,
      };
    } catch (err: any) {
      throw mapGoogleDriveError(err);
    }
  }

  async uploadResource(options: DriveUploadOptions): Promise<DriveFileInfo> {
    try {
      let folderId = options.parentId;
      if (!folderId) {
        const folder = await this.getOrCreateCampusOSFolder();
        folderId = folder.id;
      }

      const stream = require("stream");
      const buffer = Buffer.isBuffer(options.content)
        ? options.content
        : Buffer.from(options.content, "utf8");

      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      const res = await this.drive.files.create({
        requestBody: {
          name: options.name,
          mimeType: options.mimeType,
          parents: [folderId],
          description: options.description || "Uploaded via CampusOS University OS",
        },
        media: {
          mimeType: options.mimeType,
          body: bufferStream,
        },
        fields: "id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, createdTime, parents",
      });

      const file = res.data;
      if (!file.id) {
        throw new Error("Failed to upload file to Google Drive");
      }

      return {
        id: file.id,
        name: file.name || options.name,
        mimeType: file.mimeType || options.mimeType,
        sizeBytes: file.size ? Number(file.size) : buffer.length,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        webContentLink: file.webContentLink ?? undefined,
        thumbnailLink: file.thumbnailLink ?? undefined,
        parentId: folderId,
        createdAt: file.createdTime ?? new Date().toISOString(),
        isFolder: false,
      };
    } catch (err: any) {
      throw mapGoogleDriveError(err);
    }
  }

  async listFiles(folderId?: string): Promise<DriveFileInfo[]> {
    try {
      let targetFolder = folderId;
      if (!targetFolder) {
        const folder = await this.getOrCreateCampusOSFolder();
        targetFolder = folder.id;
      }

      // Query files inside the folder, excluding trashed
      const res = await this.drive.files.list({
        q: `'${targetFolder}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, createdTime, parents)",
        orderBy: "createdTime desc",
      });

      const files = res.data.files || [];
      return files.map((f) => ({
        id: f.id || "",
        name: f.name || "Untitled",
        mimeType: f.mimeType || "application/octet-stream",
        sizeBytes: f.size ? Number(f.size) : undefined,
        webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
        webContentLink: f.webContentLink ?? undefined,
        thumbnailLink: f.thumbnailLink ?? undefined,
        parentId: targetFolder,
        createdAt: f.createdTime ?? undefined,
        isFolder: f.mimeType === "application/vnd.google-apps.folder",
      }));
    } catch (err: any) {
      throw mapGoogleDriveError(err);
    }
  }

  async getFile(fileId: string): Promise<DriveFileInfo> {
    try {
      const res = await this.drive.files.get({
        fileId,
        fields: "id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, createdTime, parents",
      });

      const f = res.data;
      return {
        id: f.id || fileId,
        name: f.name || "Untitled",
        mimeType: f.mimeType || "application/octet-stream",
        sizeBytes: f.size ? Number(f.size) : undefined,
        webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
        webContentLink: f.webContentLink ?? undefined,
        thumbnailLink: f.thumbnailLink ?? undefined,
        parentId: f.parents?.[0],
        createdAt: f.createdTime ?? undefined,
        isFolder: f.mimeType === "application/vnd.google-apps.folder",
      };
    } catch (err: any) {
      throw mapGoogleDriveError(err);
    }
  }

  async downloadFileContent(fileId: string): Promise<{
    content: Buffer;
    mimeType: string;
    fileName: string;
  }> {
    try {
      const meta = await this.getFile(fileId);

      const res = await this.drive.files.get(
        { fileId, alt: "media" },
        { responseType: "arraybuffer" }
      );

      return {
        content: Buffer.from(res.data as ArrayBuffer),
        mimeType: meta.mimeType,
        fileName: meta.name,
      };
    } catch (err: any) {
      throw mapGoogleDriveError(err);
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      await this.drive.files.delete({ fileId });
      return true;
    } catch (err: any) {
      throw mapGoogleDriveError(err);
    }
  }
}

/**
 * Creates an authenticated Google Drive client using decrypted refresh token.
 * Includes simulation hooks for testing the required error states.
 */
export function createAuthenticatedGoogleDriveClient(
  decryptedRefreshToken: string,
  userId: string = "test_user"
): drive_v3.Drive {
  // Error simulation hooks for testing
  if (decryptedRefreshToken === "test_expired_token") {
    return {
      files: {
        list: () => Promise.reject({ status: 401, message: "expired_token: Invalid Credentials" }),
        get: () => Promise.reject({ status: 401, message: "expired_token: Invalid Credentials" }),
        create: () => Promise.reject({ status: 401, message: "expired_token: Invalid Credentials" }),
        delete: () => Promise.reject({ status: 401, message: "expired_token: Invalid Credentials" }),
      },
    } as any;
  }

  if (decryptedRefreshToken === "test_revoked_consent") {
    return {
      files: {
        list: () => Promise.reject({ status: 403, message: "invalid_grant: Token has been expired or revoked" }),
        get: () => Promise.reject({ status: 403, message: "invalid_grant: Token has been expired or revoked" }),
        create: () => Promise.reject({ status: 403, message: "invalid_grant: Token has been expired or revoked" }),
        delete: () => Promise.reject({ status: 403, message: "invalid_grant: Token has been expired or revoked" }),
      },
    } as any;
  }

  if (decryptedRefreshToken === "test_api_quota") {
    return {
      files: {
        list: () => Promise.reject({ status: 429, message: "quotaExceeded: User Rate Limit Exceeded" }),
        get: () => Promise.reject({ status: 429, message: "quotaExceeded: User Rate Limit Exceeded" }),
        create: () => Promise.reject({ status: 429, message: "quotaExceeded: User Rate Limit Exceeded" }),
        delete: () => Promise.reject({ status: 429, message: "quotaExceeded: User Rate Limit Exceeded" }),
      },
    } as any;
  }

  if (decryptedRefreshToken === "test_insufficient_scope") {
    return {
      files: {
        list: () => Promise.reject({ status: 403, message: "ACCESS_TOKEN_SCOPE_INSUFFICIENT: Insufficient Permission" }),
        get: () => Promise.reject({ status: 403, message: "ACCESS_TOKEN_SCOPE_INSUFFICIENT: Insufficient Permission" }),
        create: () => Promise.reject({ status: 403, message: "ACCESS_TOKEN_SCOPE_INSUFFICIENT: Insufficient Permission" }),
        delete: () => Promise.reject({ status: 403, message: "ACCESS_TOKEN_SCOPE_INSUFFICIENT: Insufficient Permission" }),
      },
    } as any;
  }

  // If in mock/test mode without credentials
  if (decryptedRefreshToken.startsWith("mock_rt_") || !process.env.GOOGLE_CLIENT_SECRET) {
    const store = getMockStorageForUser(userId);

    return {
      files: {
        list: async (params: any) => {
          const files: any[] = [];
          for (const item of store.values()) {
            if (params?.q?.includes("application/vnd.google-apps.folder")) {
              if (item.isFolder) {
                files.push({
                  id: item.id,
                  name: item.name,
                  mimeType: item.mimeType,
                  webViewLink: item.webViewLink,
                });
              }
            } else {
              files.push({
                id: item.id,
                name: item.name,
                mimeType: item.mimeType,
                size: item.sizeBytes,
                webViewLink: item.webViewLink,
                webContentLink: item.webContentLink,
                thumbnailLink: item.thumbnailLink,
                createdTime: item.createdAt,
                parents: item.parentId ? [item.parentId] : [],
              });
            }
          }
          return { data: { files } };
        },
        create: async (params: any) => {
          const fileId = `mock_drive_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const isFolder = params.requestBody?.mimeType === "application/vnd.google-apps.folder";
          const newEntry: MockDriveEntry = {
            id: fileId,
            name: params.requestBody?.name || "Untitled",
            mimeType: params.requestBody?.mimeType || "application/octet-stream",
            content: Buffer.from("mock content"),
            sizeBytes: 12,
            parentId: params.requestBody?.parents?.[0],
            webViewLink: isFolder
              ? `https://drive.google.com/drive/folders/${fileId}`
              : `https://drive.google.com/file/d/${fileId}/view`,
            webContentLink: `https://drive.google.com/uc?id=${fileId}&export=download`,
            createdAt: new Date().toISOString(),
            isFolder,
          };
          store.set(fileId, newEntry);
          return {
            data: {
              id: newEntry.id,
              name: newEntry.name,
              mimeType: newEntry.mimeType,
              size: newEntry.sizeBytes,
              webViewLink: newEntry.webViewLink,
              webContentLink: newEntry.webContentLink,
              createdTime: newEntry.createdAt,
            },
          };
        },
        get: async (params: any) => {
          const file = store.get(params.fileId);
          if (!file) {
            throw { status: 404, message: "File not found" };
          }
          if (params.alt === "media") {
            return { data: file.content };
          }
          return {
            data: {
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              size: file.sizeBytes,
              webViewLink: file.webViewLink,
              webContentLink: file.webContentLink,
              thumbnailLink: file.thumbnailLink,
              createdTime: file.createdAt,
              parents: file.parentId ? [file.parentId] : [],
            },
          };
        },
        delete: async (params: any) => {
          const deleted = store.delete(params.fileId);
          if (!deleted) {
            throw { status: 404, message: "File not found" };
          }
          return { data: {} };
        },
      },
    } as any;
  }

  // Real OAuth client
  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: decryptedRefreshToken });
  return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * Drive Provider Factory
 * Automatically returns a GoogleDriveProvider if the user has an active Google connection
 * with drive.file scope, or falls back to DemoLocalDriveProvider if unlinked or fallback requested.
 */
export function getDriveProvider(options: {
  encryptedRefreshToken?: string;
  userId: string;
  userEmail?: string;
  forceDemoFallback?: boolean;
}): DriveProvider {
  if (options.forceDemoFallback || !options.encryptedRefreshToken) {
    return new DemoLocalDriveProvider(options.userId);
  }

  try {
    const decrypted = decryptRefreshToken(options.encryptedRefreshToken);
    return new GoogleDriveProvider(decrypted, options.userId, options.userEmail);
  } catch {
    // If decryption fails, safely fallback to local demo provider
    return new DemoLocalDriveProvider(options.userId);
  }
}
