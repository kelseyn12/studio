export type StudioScript = {
  hook: string;
  body: string;
  plug: string;
  script: string;
};

export function scriptPrompt(input: {
  title: string;
  premise: string;
  hook: string;
  body: string;
  plug: string;
  script: string;
  brand: string;
  referenceUrl: string;
  referenceTranscript: string;
}): string {
  return [
    "Write a spoken UGC script the creator can film in one take.",
    "Return JSON only with keys hook, body, plug, script. No markdown.",
    "hook: first line, under 14 words, specific, no hashtags.",
    "body: the demo / proof, spoken.",
    "plug: the CTA, spoken.",
    "script: full spoken piece with [shot notes] in brackets. Not a concept memo. Not Format/Tone/Vibe labels.",
    input.brand ? `Brand: ${input.brand}` : "",
    input.title ? `Title: ${input.title}` : "",
    input.premise ? `Payoff: ${input.premise}` : "",
    input.hook ? `Current hook: ${input.hook}` : "",
    input.body ? `Current body: ${input.body}` : "",
    input.plug ? `Current plug: ${input.plug}` : "",
    input.script ? `Current script: ${input.script.slice(0, 800)}` : "",
    input.referenceUrl ? `Reference link: ${input.referenceUrl}` : "",
    input.referenceTranscript ? `What the reference says: ${input.referenceTranscript.slice(0, 1200)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function parseScript(body: Record<string, unknown>): StudioScript {
  const choices = body.choices as Array<{ message?: { content?: string } }> | undefined;
  const text = choices?.[0]?.message?.content?.trim() || "";
  if (!text) throw new Error("Model returned no script");
  const json = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(json) as Partial<StudioScript>;
  const hook = String(parsed.hook || "").trim();
  const bodyText = String(parsed.body || "").trim();
  const plug = String(parsed.plug || "").trim();
  const script = String(parsed.script || "").trim();
  if (!hook && !script) throw new Error("Model returned an empty script");
  return { hook, body: bodyText, plug, script: script || [hook, bodyText, plug].filter(Boolean).join("\n\n") };
}

export async function generateScript(
  input: Parameters<typeof scriptPrompt>[0],
  images: string[] = [],
): Promise<StudioScript> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Add OPENAI_API_KEY to .env");
  const prompt = scriptPrompt(input);
  const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
  for (const url of images.slice(0, 2)) {
    content.push({ type: "image_url", image_url: { url } });
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content }],
    }),
  });
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const error = payload.error as { message?: string } | undefined;
    throw new Error(error?.message || response.statusText);
  }
  return parseScript(payload);
}
