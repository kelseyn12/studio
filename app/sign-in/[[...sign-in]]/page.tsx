import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { hasClerk } from "@/lib/clerk-mode";

export default function SignInPage() {
  if (!hasClerk()) redirect("/login");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
      <p className="text-sm text-white">Posts your videos to YouTube</p>
      <div className="flex gap-4 text-sm">
        <a href="/privacy" className="text-white underline">
          Privacy
        </a>
        <a href="/terms" className="text-white underline">
          Terms
        </a>
      </div>
    </div>
  );
}
