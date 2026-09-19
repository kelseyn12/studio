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

export const MANAGED_NETWORKS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "threads",
  "linkedin",
  "pinterest",
] as const;
