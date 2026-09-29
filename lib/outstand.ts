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

export function postedAtFromPost(post: OutstandPost): Date | null {
  const stamps = [post.publishedAt, ...(post.socialAccounts ?? []).map((row) => row.publishedAt)].filter(
    (value): value is string => Boolean(value),
  );
  if (stamps.length) {
    const date = new Date(stamps[0]);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const live = (post.socialAccounts ?? []).some((row) => String(row.status || "").toLowerCase() === "published");
  return live ? new Date() : null;
}

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

export function parsePost(body: Record<string, unknown>): OutstandPost {
  const nested = (body.post as Record<string, unknown> | undefined) || (body.data as Record<string, unknown> | undefined);
  const data = nested && typeof nested.id === "string" ? nested : body;
  const id = String(data.id || "");
  if (!id) throw new Error("Outstand did not return a post");
  return data as unknown as OutstandPost;
}

export type CreatePostInput = {
  accounts: string[];
  content: string;
  scheduledAt?: string;
  media?: Array<{ url: string; filename: string }>;
  /** Per-network blocks (`instagram`, `tiktok`, `youtube`…) merged into the post body as Outstand expects. */
  options?: Record<string, unknown>;
};

export function postBody(input: CreatePostInput): Record<string, unknown> {
  return {
    ...(input.options ?? {}),
    containers: [{ content: input.content, media: input.media ?? [] }],
    accounts: input.accounts,
    scheduledAt: input.scheduledAt,
  };
}

export async function createPost(input: CreatePostInput): Promise<OutstandPost> {
  const payload = await outstand<Record<string, unknown>>("/posts/", {
    method: "POST",
    body: JSON.stringify(postBody(input)),
  });
  return parsePost(payload);
}

export async function getPost(id: string): Promise<OutstandPost> {
  const payload = await outstand<Record<string, unknown>>(`/posts/${id}`);
  return parsePost(payload);
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

/** Host and path exactly as Outstand signed them. `fetch` sends the file in chunks and R2 answers 403. */
export function signedPutTarget(uploadUrl: string): { hostname: string; path: string } {
  const scheme = uploadUrl.indexOf("://");
  const pathStart = scheme < 0 ? -1 : uploadUrl.indexOf("/", scheme + 3);
  if (pathStart < 0) throw new Error("Outstand upload URL is not a signed link");
  return { hostname: uploadUrl.slice(scheme + 3, pathStart), path: uploadUrl.slice(pathStart) };
}

export function storagePutError(status: number, body: string): string {
  const code = body.match(/<Code>([^<]+)<\/Code>/)?.[1];
  return code ? `Outstand storage PUT failed (${status} ${code})` : `Outstand storage PUT failed (${status})`;
}

function putSigned(uploadUrl: string, bytes: Buffer, contentType: string): Promise<{ ok: boolean; status: number; body: string }> {
  const { hostname, path } = signedPutTarget(uploadUrl);
  return new Promise((resolve, reject) => {
    void import("node:https").then(({ request }) => {
      const req = request(
        {
          hostname,
          path,
          method: "PUT",
          headers: { "Content-Type": contentType, "Content-Length": bytes.length },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            const status = res.statusCode ?? 0;
            resolve({ ok: status >= 200 && status < 300, status, body: Buffer.concat(chunks).toString("utf8") });
          });
        },
      );
      req.on("error", reject);
      req.end(bytes);
    }, reject);
  });
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
  const put = await putSigned(ticket.uploadUrl, bytes, contentType);
  if (!put.ok) throw new Error(storagePutError(put.status, put.body));
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
