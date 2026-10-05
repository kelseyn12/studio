import { postDiscord } from "@/lib/discord";

export function hasManychat(): boolean {
  return Boolean(process.env.MANYCHAT_API_KEY);
}

export function manychatPayload(input: {
  subscriberId: string;
  text: string;
  channel?: "instagram" | "whatsapp" | "messenger";
}) {
  const channel = input.channel || "instagram";
  return {
    subscriber_id: Number(input.subscriberId) || input.subscriberId,
    data: {
      version: "v2",
      content: {
        type: channel,
        messages: [{ type: "text", text: input.text }],
      },
    },
    message_tag: "ACCOUNT_UPDATE",
  };
}

export async function sendManychatText(input: {
  subscriberId: string;
  text: string;
  channel?: "instagram" | "whatsapp" | "messenger";
}): Promise<void> {
  const key = process.env.MANYCHAT_API_KEY;
  if (!key) throw new Error("Add MANYCHAT_API_KEY to .env");
  const response = await fetch("https://api.manychat.com/fb/sending/sendContent", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(manychatPayload(input)),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.status === "error") {
    throw new Error(String(body.message || response.statusText));
  }
}

/** Discord first. ManyChat only when those keys exist. A failed ping never blocks the job. */
export async function pingStudio(role: "editor" | "creator", text: string): Promise<boolean> {
  const discord = await postDiscord(role, text).catch(() => false);
  const id = role === "editor" ? process.env.MANYCHAT_EDITOR_ID : process.env.MANYCHAT_CREATOR_ID;
  if (!hasManychat() || !id) return discord;
  const channel = (process.env.MANYCHAT_CHANNEL as "instagram" | "whatsapp" | "messenger") || "instagram";
  try {
    await sendManychatText({ subscriberId: id, text, channel });
    return true;
  } catch {
    return discord;
  }
}
