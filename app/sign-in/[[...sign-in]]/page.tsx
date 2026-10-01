import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { hasClerk } from "@/lib/clerk-mode";

export default function SignInPage() {
  if (!hasClerk()) redirect("/login");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
      <a href="/privacy" className="text-sm text-white/80 underline">
        Privacy
      </a>
    </div>
  );
}
