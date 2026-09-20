const BASE = "https://api.outstand.so/v1";

export type OutstandAccount = {
  id: string;
  network: string;
  username: string;
  nickname?: string;
  isActive?: number | boolean;
};

export type OutstandPost = {
  id: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  socialAccounts?: Array<{
    id: string;
    network: string;
    username: string;
    status?: string;
    platformPostId?: string | null;
    error?: string | null;
    publishedAt?: string | null;
  }>;
};

function apiKey(): string {
  const key = process.env.OUTSTAND_API_KEY;
  if (!key) throw new Error("Add OUTSTAND_API_KEY to .env");
  return key;
}

async function outstand<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.error || body.message || response.statusText;
    throw new Error(String(message));
  }
  return body as T;
}

export function hasOutstand(): boolean {
  return Boolean(process.env.OUTSTAND_API_KEY);
}

export function connectUrl(network: string, redirectUri: string): string {
  const orgId = process.env.OUTSTAND_ORG_ID;
  if (!orgId) throw new Error("Add OUTSTAND_ORG_ID to .env");
  const url = new URL(`https://www.outstand.so/app/api/socials/${network}/${orgId}`);
  url.searchParams.set("redirect_uri", redirectUri);
  return url.toString();
}

export async function listAccounts(): Promise<OutstandAccount[]> {
  const payload = await outstand<{ data?: OutstandAccount[] }>("/social-accounts");
  return payload.data ?? [];
}

export async function createPost(input: {
  accounts: string[];
  content: string;
  scheduledAt?: string;
  media?: Array<{ url: string; filename: string }>;
}): Promise<OutstandPost> {
  const payload = await outstand<{ post: OutstandPost }>("/posts/", {
    method: "POST",
    body: JSON.stringify({
      containers: [{ content: input.content, media: input.media ?? [] }],
      accounts: input.accounts,
      scheduledAt: input.scheduledAt,
    }),
  });
  return payload.post;
}

export async function getPost(id: string): Promise<OutstandPost> {
  const payload = await outstand<{ post: OutstandPost }>(`/posts/${id}`);
  return payload.post;
}

export async function cancelPost(id: string): Promise<void> {
  await outstand(`/posts/${id}`, { method: "DELETE" });
}

export async function getPostAnalytics(id: string): Promise<Record<string, unknown>> {
  return outstand(`/posts/${id}/analytics`);
}

export function parseUploadTicket(body: Record<string, unknown>): { id: string; uploadUrl: string } {
  const data = (body.data as Record<string, unknown> | undefined) ?? body;
  const id = String(data.id || "");
  const uploadUrl = String(data.upload_url || data.uploadUrl || "");
  if (!id || !uploadUrl) throw new Error("Outstand did not return an upload URL");
  return { id, uploadUrl };
}

export function parseConfirm(body: Record<string, unknown>): { url: string } {
  const data = (body.data as Record<string, unknown> | undefined) ?? body;
  const url = String(data.url || "");
  if (!url) throw new Error("Outstand confirm returned no public URL");
  return { url };
}

export async function uploadMedia(
  fileAbs: string,
  filename: string,
  contentType = "video/mp4",
): Promise<{ id: string; url: string; size: number }> {
  const { readFile, stat } = await import("fs/promises");
  const size = (await stat(fileAbs)).size;
  const ticketBody = await outstand<Record<string, unknown>>("/media/upload", {
    method: "POST",
    body: JSON.stringify({ filename, content_type: contentType }),
  });
  const ticket = parseUploadTicket(ticketBody);
  const bytes = await readFile(fileAbs);
  const put = await fetch(ticket.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: bytes,
  });
  if (!put.ok) throw new Error(`Outstand storage PUT failed (${put.status})`);
  const confirmed = await outstand<Record<string, unknown>>(`/media/${ticket.id}/confirm`, {
    method: "POST",
    body: JSON.stringify({ size }),
  });
  const { url } = parseConfirm(confirmed);
  return { id: ticket.id, url, size };
}

export const MANAGED_NETWORKS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "threads",
  "linkedin",
  "pinterest",
] as const;
