const CUTS_URL = "https://system-studio.fly.dev/edits";

export type PingRole = "editor" | "creator";

/** "<@id> New job: mix 2. Open Cuts." plus the Cuts link, so the ping is tappable. */
export function discordMessage(role: PingRole, text: string, ids: { editor?: string; creator?: string }): string {
  const id = (role === "editor" ? ids.editor : ids.creator)?.trim();
  const mention = id ? `<@${id}> ` : "";
  const body = text.includes("http") ? text : `${text} ${CUTS_URL}`;
  return `${mention}${body}`.slice(0, 2000);
}

export function hasDiscord(): boolean {
  return Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID);
}

/** Posts into the Studio Discord channel and mentions the person the ping is for. */
export async function postDiscord(role: PingRole, text: string): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;
  if (!token || !channelId) return false;
  const content = discordMessage(role, text, {
    editor: process.env.DISCORD_EDITOR_ID,
    creator: process.env.DISCORD_CREATOR_ID,
  });
  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content, allowed_mentions: { parse: ["users"] } }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { code?: number };
    throw new Error(`Discord ${response.status}${body.code ? ` ${body.code}` : ""}`);
  }
  return true;
}
