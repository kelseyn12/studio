export function rewritePrompt(input: { hook: string; premise: string; script: string }): string {
  return [
    "Rewrite this UGC hook. Keep it spoken, specific, and under 14 words.",
    "Do not add hashtags. Return only the new hook.",
    input.premise ? `Payoff: ${input.premise}` : "",
    input.script ? `Script: ${input.script.slice(0, 500)}` : "",
    `Current hook: ${input.hook || "(none)"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function parseRewrite(body: Record<string, unknown>): string {
  const choices = body.choices as Array<{ message?: { content?: string } }> | undefined;
  const text = choices?.[0]?.message?.content?.trim() || "";
  if (!text) throw new Error("Model returned no hook");
  return text.replace(/^["']|["']$/g, "");
}

export async function rewriteHook(input: { hook: string; premise: string; script: string }): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Add OPENAI_API_KEY to .env");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [{ role: "user", content: rewritePrompt(input) }],
    }),
  });
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const error = payload.error as { message?: string } | undefined;
    throw new Error(error?.message || response.statusText);
  }
  return parseRewrite(payload);
}
