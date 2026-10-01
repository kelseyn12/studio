import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy · System Studio",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-white">
      <article className="mx-auto max-w-xl space-y-4 text-sm leading-6">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p>
          System Studio is a private scheduling tool run by Kelsey Nocek. It is used to plan, edit, and publish her own
          videos on her own channels.
        </p>
        <p>
          System Studio uses YouTube API Services. When a YouTube channel is connected, the tool can upload videos she
          chooses and read the view, like, and comment counts for those videos. By using YouTube features you agree to
          the{" "}
          <a className="underline" href="https://www.youtube.com/t/terms">
            YouTube Terms of Service
          </a>
          .
        </p>
        <p>
          Google’s privacy policy is at{" "}
          <a className="underline" href="https://policies.google.com/privacy">
            https://policies.google.com/privacy
          </a>
          .
        </p>
        <p>
          The tool stores the video title, caption, schedule, whether the post went out, and the view, like, and comment
          counts. If she pastes a YouTube link after posting a video herself, that link and its public view count are
          stored too. This information stays in her private workspace. It is not sold, and it is not used to advertise
          to other people.
        </p>
        <p>
          An editor she invites can see the job notes and files for a video she assigns. The editor cannot connect
          YouTube or see the channel’s private account access.
        </p>
        <p>
          You can remove System Studio’s access to a Google account at any time on Google’s security page:{" "}
          <a className="underline" href="https://security.google.com/settings/security/permissions">
            https://security.google.com/settings/security/permissions
          </a>
          . Deleting a video inside System Studio removes that video’s stored counts from the tool. The public video
          stays on YouTube until it is deleted there.
        </p>
        <p>
          Questions:{" "}
          <a className="underline" href="https://www.youtube.com/@kelseynocekugc">
            https://www.youtube.com/@kelseynocekugc
          </a>
        </p>
      </article>
    </main>
  );
}
