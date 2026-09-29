import { supabase } from "./supabase-client";

// ── Uploads to Supabase Storage (bucket "uploads", migration 035) ───────────
//
// One helper for every file the app stores: images, files and audio in pages,
// covers, uploaded icons and profile pictures. Returns the file's public URL,
// which is what page content keeps.
//
// Uploads go through XMLHttpRequest to the Storage REST endpoint instead of
// supabase.storage.upload(), because the SDK reports no progress and the
// upload nodes and the avatar button show a progress bar.

export const UPLOADS_BUCKET = "uploads";
/** The bucket's own limit (migration 035). Callers may set a lower one. */
export const UPLOADS_MAX_BYTES = 25 * 1024 * 1024;

/** Where a file goes: a folder of the current workspace, or your own folder. */
export type UploadFolder = "content" | "covers" | "icons" | "avatar";

interface UploadOptions {
  onProgress?: (event: { progress: number }) => void;
  signal?: AbortSignal;
}

// Storage keys can't hold every character: keep a safe version of the name.
function safeFileName(name: string): string {
  const cleaned = name.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");
  return cleaned.slice(-120) || "file";
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to upload files.");
  return data.user.id;
}

// The workspace you're in right now (people.workspace_id), read fresh each
// time so a workspace switch is picked up.
async function currentWorkspaceId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("people")
    .select("workspace_id")
    .eq("id", userId)
    .single();
  if (error || !data?.workspace_id) {
    throw new Error("No workspace to upload into.");
  }
  return data.workspace_id as string;
}

async function folderPath(folder: UploadFolder): Promise<string> {
  const userId = await currentUserId();
  if (folder === "avatar") return `u/${userId}`;
  const workspaceId = await currentWorkspaceId(userId);
  return `w/${workspaceId}/${folder}`;
}

export function publicUrl(path: string): string {
  return supabase.storage.from(UPLOADS_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

/**
 * Upload one file and return its public URL. Reports progress (0–100) and
 * stops when `signal` aborts.
 */
export async function uploadFile(
  file: File,
  folder: UploadFolder,
  { onProgress, signal }: UploadOptions = {},
): Promise<string> {
  if (file.size > UPLOADS_MAX_BYTES) {
    throw new Error("File is larger than 25 MB.");
  }
  if (signal?.aborted) throw new Error("Upload cancelled");

  const dir = await folderPath(folder);
  const path = `${dir}/${crypto.randomUUID()}-${safeFileName(file.name)}`;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sign in to upload files.");

  const base = import.meta.env.VITE_SUPABASE_URL as string;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  const endpoint = `${base}/storage/v1/object/${UPLOADS_BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", apiKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.({
          progress: Math.round((event.loaded / event.total) * 100),
        });
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.({ progress: 100 });
        resolve();
      } else {
        let message = `Upload failed (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText) as { message?: string };
          if (body.message) message = body.message;
        } catch {
          /* not JSON */
        }
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    xhr.send(file);
  });

  return publicUrl(path);
}

/** Public URLs of the most recent uploads in a folder, newest first. */
export async function listUploads(
  folder: Exclude<UploadFolder, "avatar">,
  limit = 30,
): Promise<string[]> {
  const dir = await folderPath(folder);
  const { data, error } = await supabase.storage
    .from(UPLOADS_BUCKET)
    .list(dir, { limit, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((item) => item.id) // folders come back without an id
    .map((item) => publicUrl(`${dir}/${item.name}`));
}
