import { access, mkdir, writeFile } from "fs/promises";
import path from "path";
import { localRoot } from "@/lib/files";
import { emojiKey } from "@/lib/hook-logos-math";

/** Google's Noto Color Emoji art (OFL). 512px, so a big flame stays crisp on a 1080 frame. */
const EMOJI_CDN = "https://fonts.gstatic.com/s/e/notoemoji/latest";
const EMOJI_PX = 512;

/** Local PNG for an emoji mark, fetched once and kept. Null when offline or unknown. */
export async function emojiImage(text: string): Promise<string | null> {
  const key = emojiKey(text);
  if (!key) return null;
  const file = path.join(localRoot(), "emoji", `${key}.png`);
  try {
    await access(file);
    return file;
  } catch {
    // not cached yet
  }
  try {
    const response = await fetch(`${EMOJI_CDN}/${key}/${EMOJI_PX}.png`);
    if (!response.ok) return null;
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(await response.arrayBuffer()));
    return file;
  } catch {
    return null;
  }
}
