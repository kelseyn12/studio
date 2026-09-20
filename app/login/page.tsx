"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        pin: formData.get("pin"),
        role: formData.get("role"),
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Could not sign in");
      setPending(false);
      return;
    }
    const body = await response.json().catch(() => ({}));
    router.push(params.get("next") || body.home || "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-4">
      <div>
        <p className="text-sm text-mute">One place for the whole week</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">System Studio</h1>
        <p className="mt-2 text-mute">Use the email from Team. Your role is already set there.</p>
      </div>
      <input name="name" required placeholder="Your name" className="field" />
      <input name="email" type="email" required placeholder="Email from Team" className="field" />
      <select name="role" className="field" defaultValue="CREATOR">
        <option value="CREATOR">Creator — first setup only</option>
        <option value="EDITOR">Editor — first setup only</option>
        <option value="OPERATOR">Operator — first setup only</option>
      </select>
      <input name="pin" required placeholder="Studio PIN" className="field" />
      {error ? <p className="text-sm text-review">{error}</p> : null}
      <button disabled={pending} className="w-full rounded-xl bg-sun py-3 font-semibold text-ink">
        {pending ? "Opening…" : "Enter studio"}
      </button>
      <p className="text-xs text-mute">
        Add people on Team first. After that, email + PIN loads their desk. Role on this screen is ignored if the email
        already exists.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
