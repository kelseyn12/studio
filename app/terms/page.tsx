import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms · System Studio",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-white">
      <article className="mx-auto max-w-xl space-y-4 text-sm leading-6">
        <h1 className="text-3xl font-semibold tracking-tight">Terms</h1>
        <p>
          System Studio is a private tool run by Kelsey Nocek. It is for planning and publishing her own videos on her
          own channels. It is not offered to the public.
        </p>
        <p>
          Videos sent to YouTube are posted to channels she connects. Those uploads follow the{" "}
          <a className="underline" href="https://www.youtube.com/t/terms">
            YouTube Terms of Service
          </a>
          . System Studio uses YouTube API Services only to upload videos she chooses and to read view, like, and
          comment counts for those videos.
        </p>
        <p>
          She can disconnect YouTube at any time from Google’s security page:{" "}
          <a className="underline" href="https://security.google.com/settings/security/permissions">
            https://security.google.com/settings/security/permissions
          </a>
          .
        </p>
        <p>
          How data is handled is in the{" "}
          <a className="underline" href="/privacy">
            privacy policy
          </a>
          .
        </p>
      </article>
    </main>
  );
}
