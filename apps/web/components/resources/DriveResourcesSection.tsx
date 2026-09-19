"use client";

import React, { useState, useEffect } from "react";
import {
  Folder,
  FileText,
  Upload,
  Download,
  ExternalLink,
  Trash2,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link2Off,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@campusos/ui";

interface DriveFile {
  id: string;
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

export function DriveResourcesSection() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [provider, setProvider] = useState<"google_drive" | "demo_fallback">("demo_fallback");
  const [email, setEmail] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folder, setFolder] = useState<{ id: string; name: string; webViewLink?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Upload modal / input states
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [entityType, setEntityType] = useState<"RESOURCE" | "SYLLABUS" | "EVENT_ATTACHMENT">("RESOURCE");

  const checkStatusAndLoadFiles = async () => {
    setLoading(true);
    try {
      // 1. Status
      const statusRes = await fetch("/api/google/drive/status");
      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        setConnected(statusJson.connected);
        setProvider(statusJson.provider);
        setEmail(statusJson.email || null);
      }

      // 2. Files
      const filesRes = await fetch("/api/google/drive/files");
      if (filesRes.ok) {
        const filesJson = await filesRes.json();
        setFiles(filesJson.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load Google Drive resources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatusAndLoadFiles();
  }, []);

  const handleConnectDrive = async () => {
    try {
      const res = await fetch("/api/google/drive/auth-url");
      const data = await res.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Failed to generate Google Drive authorization link." });
    }
  };

  const handleDisconnectDrive = async () => {
    try {
      const res = await fetch("/api/google/drive/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setConnected(false);
        setProvider("demo_fallback");
        setEmail(null);
        setStatusMessage({ type: "success", text: data.message });
        checkStatusAndLoadFiles();
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Failed to disconnect Google Drive." });
    }
  };

  const handleCreateFolder = async () => {
    try {
      const res = await fetch("/api/google/drive/folder", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setFolder(data.data);
        setStatusMessage({
          type: "success",
          text: `Linked directory: "${data.data.name}"`,
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Failed to create CampusOS folder." });
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !fileContent.trim()) {
      setStatusMessage({ type: "error", text: "Please provide both filename and content." });
      return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/google/drive/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fileName.trim(),
          content: fileContent,
          mimeType: fileName.endsWith(".json")
            ? "application/json"
            : fileName.endsWith(".md")
            ? "text/markdown"
            : fileName.endsWith(".pdf")
            ? "application/pdf"
            : "text/plain",
          entityType,
          description: `CampusOS academic resource uploaded via web portal.`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: "success",
          text: `Resource "${data.data.name}" uploaded successfully to Google Drive.`,
        });
        setFileName("");
        setFileContent("");
        setShowUploadForm(false);
        checkStatusAndLoadFiles();
      } else {
        setStatusMessage({ type: "error", text: data.message || "Failed to upload file." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "An error occurred during file upload." });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, name: string) => {
    if (!confirm(`Delete "${name}" from Drive and CampusOS?`)) return;

    try {
      const res = await fetch(`/api/google/drive/files/${fileId}`, { method: "DELETE" });
      if (res.ok) {
        setFiles(files.filter((f) => f.id !== fileId));
        setStatusMessage({ type: "success", text: `Deleted "${name}".` });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Failed to delete file." });
    }
  };

  return (
    <div className="space-y-6 pt-4 border-t border-[var(--border-subtle)]">
      {/* Header and Connection Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[var(--brand-indigo)]" />
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Digital Document Storage & Academic Drive
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Linked to Google Drive using secure <code className="text-[var(--brand-indigo)] font-mono">drive.file</code> scope (per-file permissions).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {connected ? (
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm" withDot>
                Google Drive Connected ({email || "Linked"})
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDisconnectDrive}
                className="text-xs text-[var(--status-critical)]"
              >
                <Link2Off className="w-3.5 h-3.5 mr-1" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="neutral" size="sm">
                Demo Storage Mode Active
              </Badge>
              <Button variant="primary" size="sm" onClick={handleConnectDrive}>
                <HardDrive className="w-3.5 h-3.5 mr-1" />
                Connect Google Drive
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={checkStatusAndLoadFiles}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between gap-2 border ${
            statusMessage.type === "success"
              ? "bg-[var(--status-success-surface)] border-[var(--status-success-border)] text-[var(--status-success)]"
              : "bg-[var(--status-critical-surface)] border-[var(--status-critical-border)] text-[var(--status-critical)]"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Strip: Folder Setup & Upload Resource */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl">
        <div className="flex items-center gap-3">
          <Folder className="w-5 h-5 text-[var(--brand-indigo)]" />
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              Workspace Folder: CampusOS Resources
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Dedicated isolated container in your Drive for campus materials.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleCreateFolder}>
            Verify / Create Folder
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {showUploadForm ? "Cancel" : "Upload Resource"}
          </Button>
        </div>
      </div>

      {/* Inline Upload Form */}
      {showUploadForm && (
        <Card variant="default" className="border-2 border-[var(--brand-indigo)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4 text-[var(--brand-indigo)]" />
              Upload Academic File to CampusOS Drive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUploadFile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    File Name (e.g. syllabus_cs101.txt, notes.md)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. quantum_computing_lecture1.md"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-base)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-indigo)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Resource Category
                  </label>
                  <select
                    value={entityType}
                    onChange={(e: any) => setEntityType(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-base)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-indigo)]"
                  >
                    <option value="RESOURCE">Academic Resource</option>
                    <option value="SYLLABUS">Course Syllabus</option>
                    <option value="EVENT_ATTACHMENT">Event Attachment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  File Text / Documentation Content
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste or type resource notes, syllabus details, or markdown content..."
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[var(--surface-base)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-indigo)]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploadForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={uploading}>
                  {uploading ? "Uploading..." : "Save to Google Drive"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* File Listings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            CampusOS Linked Files ({files.length})
          </h3>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Provider: {provider === "google_drive" ? "Google Drive (drive.file)" : "Local Demo Store"}
          </span>
        </div>

        {files.length === 0 ? (
          <div className="p-8 text-center bg-[var(--surface-raised)] rounded-xl border border-dashed border-[var(--border-subtle)]">
            <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
            <p className="text-xs text-[var(--text-muted)]">No resources uploaded yet.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => setShowUploadForm(true)}
            >
              Upload First Resource
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <Card
                key={file.id}
                variant="default"
                className="flex flex-col justify-between hover:border-[var(--border-interactive)] transition-all duration-150"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[var(--surface-raised)] text-[var(--brand-indigo)]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate" title={file.name}>
                          {file.name}
                        </h4>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono">
                          {file.sizeBytes ? `${file.sizeBytes} bytes` : "Doc"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {file.mimeType.split("/")[1] || "file"}
                    </Badge>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                    <div className="truncate font-mono text-[10px]">
                      ID: {file.id}
                    </div>
                  </div>
                </CardContent>

                <div className="p-3 bg-[var(--surface-raised)] border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Open in Drive */}
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-[var(--brand-indigo)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </a>

                    {/* Direct Download */}
                    <a
                      href={`/api/google/drive/files/${file.id}?download=true`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                      download={file.name}
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </a>
                  </div>

                  <button
                    onClick={() => handleDeleteFile(file.id, file.name)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--status-critical)] transition-colors"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
